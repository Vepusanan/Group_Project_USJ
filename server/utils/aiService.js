// Server-side AI service wrapper — Task T1.4
//
// THE single entry point for every AI feature (Phase 7). Building it once means:
//   - the Anthropic API key lives ONLY on the server (never sent to the browser),
//   - every call has a hard 10s timeout,
//   - failures degrade gracefully (callers get a clean "unavailable" signal,
//     never an exception that breaks the page),
//   - a per-user daily call limit caps cost,
//   - sensitive (data-room) content is sent with training-retention disabled.
//
// Usage:
//   const r = await aiService.generate({ userId, prompt, system, sensitive });
//   if (r.ok) use(r.text); else showFallback(r.reason);
//
// generate() NEVER throws for operational failures — it always resolves to one
// of:
//   { ok: true,  text, model, usage }
//   { ok: false, unavailable: true, reason }   // timeout / API error / no key
//   { ok: false, limited: true, reason }       // daily limit reached
//
// No external SDK: uses Node's built-in fetch (Node 18+) + AbortController.

import pool from "../config/database.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// Latest models (2026). Sonnet is the sensible default for most features;
// callers can override per call (e.g. a cheap model for short tasks).
const DEFAULT_MODEL = process.env.AI_MODEL || "claude-sonnet-4-6";

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 10_000); // 10s per the PRD
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT || 50); // per-user calls/day
const MAX_TOKENS = Number(process.env.AI_MAX_TOKENS || 1024);

const UNAVAILABLE = (reason) => ({ ok: false, unavailable: true, reason });
const LIMITED = (reason) => ({ ok: false, limited: true, reason });

/**
 * Read today's call count for a user. Returns 0 if no row yet.
 * Best-effort: if the DB is unreachable we return 0 so the limit check fails
 * OPEN (don't block AI just because the counter is down) — the real backstop is
 * the API itself. Cost control is a soft guard, not a security boundary.
 */
async function getTodayCount(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT count FROM public.ai_usage
       WHERE user_id = $1 AND usage_date = CURRENT_DATE`,
      [userId],
    );
    return rows[0]?.count ?? 0;
  } catch (error) {
    console.error("ai_usage read failed:", error.message);
    return 0;
  }
}

/** Increment today's counter (and token tallies) after a successful call. */
async function recordUsage(userId, usage = {}) {
  const inTok = usage.input_tokens || 0;
  const outTok = usage.output_tokens || 0;
  try {
    await pool.query(
      `INSERT INTO public.ai_usage (user_id, usage_date, count, input_tokens, output_tokens, updated_at)
       VALUES ($1, CURRENT_DATE, 1, $2, $3, NOW())
       ON CONFLICT (user_id, usage_date)
       DO UPDATE SET count = public.ai_usage.count + 1,
                     input_tokens = public.ai_usage.input_tokens + EXCLUDED.input_tokens,
                     output_tokens = public.ai_usage.output_tokens + EXCLUDED.output_tokens,
                     updated_at = NOW()`,
      [userId, inTok, outTok],
    );
  } catch (error) {
    // Never let a counter write failure break the user's feature.
    console.error("ai_usage write failed:", error.message);
  }
}

/**
 * Generate text from the Claude API.
 *
 * @param {Object} opts
 *   @param {string}  opts.userId     required — whose daily quota this counts against
 *   @param {string}  opts.prompt     required — the user/content message
 *   @param {string} [opts.system]    optional system prompt
 *   @param {boolean}[opts.sensitive] data-room/sensitive content → disable training retention
 *   @param {string} [opts.model]     override the default model
 *   @param {number} [opts.maxTokens] override max output tokens
 *   @param {Array}  [opts.documents] optional content blocks (e.g. PDF) to prepend
 * @returns {Promise<object>} see module header for the shape; never throws.
 */
async function generate(opts = {}) {
  const {
    userId,
    prompt,
    system,
    sensitive = false,
    model = DEFAULT_MODEL,
    maxTokens = MAX_TOKENS,
    documents = [],
  } = opts;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No key configured → graceful degradation. Phases 1–6 and local dev run
    // fine without AI; features must show their fallback, not crash.
    return UNAVAILABLE("AI is not configured.");
  }
  if (!userId || !prompt) {
    return UNAVAILABLE("AI request missing userId or prompt.");
  }

  // Per-user daily limit (cost cap).
  const used = await getTodayCount(userId);
  if (used >= DAILY_LIMIT) {
    return LIMITED(`Daily AI limit reached (${DAILY_LIMIT}). Try again tomorrow.`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const content = [
      ...documents, // optional document/content blocks first
      { type: "text", text: prompt },
    ];

    const body = {
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content }],
    };
    if (system) body.system = system;

    const headers = {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    };
    // For sensitive (data-room) content, opt out of using the data to improve
    // models. The wrapper applies this automatically so callers can't forget.
    if (sensitive) {
      headers["anthropic-beta"] = "data-retention-disabled";
    }

    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`AI API error ${res.status}:`, detail.slice(0, 300));
      return UNAVAILABLE("AI temporarily unavailable.");
    }

    const data = await res.json();
    const text = Array.isArray(data.content)
      ? data.content.filter((b) => b.type === "text").map((b) => b.text).join("")
      : "";

    if (!text) {
      return UNAVAILABLE("AI returned no content.");
    }

    // Count usage only on success.
    await recordUsage(userId, data.usage);

    return { ok: true, text, model: data.model || model, usage: data.usage };
  } catch (error) {
    if (error.name === "AbortError") {
      return UNAVAILABLE("AI request timed out.");
    }
    console.error("AI request failed:", error.message);
    return UNAVAILABLE("AI temporarily unavailable.");
  } finally {
    clearTimeout(timer);
  }
}

/** Whether AI is configured at all (handy for hiding AI UI when no key set). */
function isConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const aiService = { generate, isConfigured, DAILY_LIMIT, DEFAULT_MODEL };
export default aiService;
