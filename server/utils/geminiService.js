import { logAiUsage } from "../repositories/AiUsageRepository.js";
import { sanitizeGeminiContext } from "./geminiSanitize.js";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const trackGemini = (feature, userId = null) => {
  logAiUsage(feature, userId).catch(() => undefined);
};
const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 10000);

const geminiFetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
  });

const extractText = (payload) => {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  return parts
    .map((part) => part?.text || "")
    .join("")
    .trim() || null;
};

/**
 * Generate a short compatibility explanation via Gemini.
 * Returns null when the API is unavailable so callers can fall back.
 */
export async function generateGeminiMatchExplanation({
  matchScore,
  dimensionScores = {},
  startup = {},
  investor = {},
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  trackGemini("match_explanation");

  const safe = sanitizeGeminiContext({ startup, investor });

  const prompt = `You are an investment platform assistant. Write ONE concise paragraph (2-4 sentences, max 120 words) explaining why this startup matches this investor's profile.

Overall compatibility score: ${Math.round(Number(matchScore) || 0)}%

Dimension scores (0-100):
${Object.entries(dimensionScores || {})
  .map(([key, value]) => `- ${key}: ${Math.round(Number(value) || 0)}`)
  .join("\n")}

Startup:
- Company: ${safe.startup.company_name || "Unknown"}
- Industry: ${safe.startup.industry || "N/A"}
- Business stage: ${safe.startup.current_stage || "N/A"}
- Funding stage: ${safe.startup.funding_stage || "N/A"}
- Location: ${[safe.startup.location_city, safe.startup.location_country].filter(Boolean).join(", ") || "N/A"}
- Revenue: ${safe.startup.revenue_status || "N/A"}
- Tagline: ${safe.startup.tagline || "N/A"}

Investor preferences:
- Name/firm: ${safe.investor.name_or_firm || "Investor"}
- Type: ${safe.investor.investor_type || "N/A"}
- Industries: ${JSON.stringify(safe.investor.industries_of_interest || [])}
- Stages: ${JSON.stringify(safe.investor.stage_preference || [])}
- Geography: ${JSON.stringify(safe.investor.geographic_preference || [])}
- Check size: ${safe.investor.min_investment_size || "?"} - ${safe.investor.max_investment_size || "?"}
- Thesis: ${String(safe.investor.investment_thesis || "").slice(0, 400)}

Be specific, professional, and balanced. Mention both alignment strengths and any notable gaps. Do not use bullet points.`;

  try {
    const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await geminiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          // 2.5+ models are "thinking" models that consume output tokens on
          // internal reasoning. Disable thinking so the full budget goes to the
          // visible answer, otherwise the explanation gets truncated mid-sentence.
          thinkingConfig: { thinkingBudget: 0 },
          maxOutputTokens: 400,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error(
        `Gemini API error (${response.status}):`,
        errBody.slice(0, 300),
      );
      return null;
    }

    const data = await response.json();
    const text = extractText(data);
    if (!text) return null;

    return text.replace(/\s+/g, " ").trim();
  } catch (error) {
    console.error("Gemini match explanation failed:", error.message);
    return null;
  }
}

const parseJsonFromGeminiText = (text) => {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] || text).trim();
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
};

/**
 * Analyse a pitch deck PDF for structure, gaps, and strengths.
 * Returns null when Gemini is unavailable.
 */
export async function generateGeminiPitchDeckAnalysis({
  companyName,
  pdfBuffer,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !pdfBuffer?.length) return null;
  trackGemini("pitch_deck_analysis");

  const maxBytes = 8 * 1024 * 1024;
  if (pdfBuffer.length > maxBytes) {
    return {
      error: "Pitch deck is too large for AI analysis (max 8MB).",
    };
  }

  const base64 = pdfBuffer.toString("base64");
  const prompt = `You are an experienced startup pitch deck evaluator reviewing a deck for ${companyName || "a startup"}.

Analyse the attached PDF against these standard investor sections:
Problem, Solution, Market Size, Product, Business Model, Traction, Team, Financials, Use of Funds, Ask.

Respond with ONLY valid JSON (no markdown fences):
{
  "summary": "2-3 sentence overview",
  "sections_present": [{"name": "Problem", "quality": "strong|adequate|weak|missing", "note": "brief assessment"}],
  "missing_sections": ["sections missing or materially weak vs investor expectations"],
  "improvement_suggestions": ["3-5 specific, actionable improvements"],
  "strengths": ["2-5 specific strengths observed"]
}

Include every standard section in sections_present. Be specific and professional.`;

  try {
    const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await geminiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "application/pdf",
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          thinkingConfig: { thinkingBudget: 0 },
          maxOutputTokens: 900,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error(
        `Gemini pitch deck API error (${response.status}):`,
        errBody.slice(0, 300),
      );
      return null;
    }

    const data = await response.json();
    const text = extractText(data);
    const parsed = parseJsonFromGeminiText(text);
    if (!parsed) return null;

    const sectionsPresent = Array.isArray(parsed.sections_present)
      ? parsed.sections_present
      : Array.isArray(parsed.structure)
        ? parsed.structure.map((name) => ({ name, quality: "adequate", note: "" }))
        : [];

    return {
      summary: String(parsed.summary || "").trim(),
      sections_present: sectionsPresent,
      structure: sectionsPresent.map((s) =>
        typeof s === "string" ? s : s.name,
      ),
      missing_sections: Array.isArray(parsed.missing_sections)
        ? parsed.missing_sections
        : [],
      improvement_suggestions: Array.isArray(parsed.improvement_suggestions)
        ? parsed.improvement_suggestions
        : Array.isArray(parsed.observations)
          ? parsed.observations
          : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      observations: Array.isArray(parsed.improvement_suggestions)
        ? parsed.improvement_suggestions
        : Array.isArray(parsed.observations)
          ? parsed.observations
          : [],
      source: "gemini",
    };
  } catch (error) {
    console.error("Gemini pitch deck analysis failed:", error.message);
    return null;
  }
}

/**
 * Summarise a financial / due diligence document from the data room.
 * Returns null when Gemini is unavailable.
 */
export async function generateGeminiFinancialDocumentAnalysis({
  documentName,
  companyName,
  pdfBuffer,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !pdfBuffer?.length) return null;
  trackGemini("financial_document_analysis");

  const maxBytes = 8 * 1024 * 1024;
  if (pdfBuffer.length > maxBytes) {
    return {
      error: "Document is too large for AI analysis (max 8MB).",
    };
  }

  const base64 = pdfBuffer.toString("base64");
  const prompt = `You are a venture capital analyst summarising a due diligence document for ${companyName || "a startup"}.
Document title: ${documentName || "Untitled"}

Analyse the attached PDF and respond with ONLY valid JSON (no markdown fences):
{
  "business_overview": "concise business overview from the document",
  "market_opportunity": "key market opportunity described",
  "revenue_model": "revenue model and monetisation approach",
  "traction": "current traction, metrics, or milestones cited",
  "funding_requirements": "funding needs or capital context if mentioned",
  "key_risks": ["2-4 material risks or gaps for due diligence"],
  "document_type": "e.g. business plan, financial statements, cap table"
}

If a section is not covered in the document, state that briefly rather than inventing details.`;

  try {
    const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await geminiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "application/pdf",
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          thinkingConfig: { thinkingBudget: 0 },
          maxOutputTokens: 900,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error(
        `Gemini financial doc API error (${response.status}):`,
        errBody.slice(0, 300),
      );
      return null;
    }

    const data = await response.json();
    const text = extractText(data);
    const parsed = parseJsonFromGeminiText(text);
    if (!parsed) return null;

    const businessOverview = String(
      parsed.business_overview || parsed.summary || "",
    ).trim();

    return {
      summary: businessOverview,
      business_overview: businessOverview,
      market_opportunity: String(parsed.market_opportunity || "").trim(),
      revenue_model: String(parsed.revenue_model || "").trim(),
      traction: String(parsed.traction || "").trim(),
      funding_requirements: String(parsed.funding_requirements || "").trim(),
      key_risks: Array.isArray(parsed.key_risks)
        ? parsed.key_risks
        : Array.isArray(parsed.risks)
          ? parsed.risks
          : [],
      document_type: String(parsed.document_type || "").trim(),
      key_metrics: Array.isArray(parsed.key_metrics) ? parsed.key_metrics : [],
      risks: Array.isArray(parsed.key_risks)
        ? parsed.key_risks
        : Array.isArray(parsed.risks)
          ? parsed.risks
          : [],
      follow_up_questions: Array.isArray(parsed.follow_up_questions)
        ? parsed.follow_up_questions
        : [],
      source: "gemini",
    };
  } catch (error) {
    console.error("Gemini financial document analysis failed:", error.message);
    return null;
  }
}

const FUNDING_STAGE_VALUES = [
  "PRE_SEED",
  "SEED",
  "SERIES_A",
  "SERIES_B",
  "SERIES_C",
  "SERIES_D_PLUS",
];

const REVENUE_STATUS_VALUES = [
  "PRE_REVENUE",
  "REVENUE_GENERATING",
  "PROFITABLE",
];

/**
 * Parse natural-language investor search into structured discovery filters.
 */
export async function generateGeminiDiscoveryFilters(phrase) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !String(phrase || "").trim()) return null;
  trackGemini("discovery_filters");

  const prompt = `Extract startup discovery filters from this investor search phrase:
"${String(phrase).trim()}"

Return ONLY valid JSON matching this schema (use null for unknown fields):
{
  "industry": "string or null — e.g. FinTech, HealthTech",
  "location_country": "string or null — country or region name",
  "funding_stage": "one of ${FUNDING_STAGE_VALUES.join(", ")} or null",
  "revenue_status": "one of ${REVENUE_STATUS_VALUES.join(", ")} or null",
  "max_amount": "number in USD or null — maximum raise amount sought",
  "keywords": "string or null — remaining search terms not captured above"
}

Map conversational stage names (e.g. seed, pre-seed) to the enum values.`;

  try {
    const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await geminiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          thinkingConfig: { thinkingBudget: 0 },
          maxOutputTokens: 400,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const parsed = parseJsonFromGeminiText(extractText(data));
    if (!parsed) return null;

    const fundingStage = parsed.funding_stage
      ? String(parsed.funding_stage).toUpperCase().replace(/-/g, "_")
      : null;
    const revenueStatus = parsed.revenue_status
      ? String(parsed.revenue_status).toUpperCase().replace(/-/g, "_")
      : null;

    return {
      industry: parsed.industry ? String(parsed.industry).trim() : null,
      location_country: parsed.location_country
        ? String(parsed.location_country).trim()
        : null,
      funding_stage: FUNDING_STAGE_VALUES.includes(fundingStage)
        ? fundingStage
        : null,
      revenue_status: REVENUE_STATUS_VALUES.includes(revenueStatus)
        ? revenueStatus
        : null,
      max_amount:
        parsed.max_amount != null && !Number.isNaN(Number(parsed.max_amount))
          ? Number(parsed.max_amount)
          : null,
      keywords: parsed.keywords ? String(parsed.keywords).trim() : null,
    };
  } catch (error) {
    console.error("Gemini discovery filter parse failed:", error.message);
    return null;
  }
}

/**
 * Synthesise a structured investor meeting brief from aggregated context.
 */
export async function generateGeminiMeetingBrief(context = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  trackGemini("meeting_brief");

  const safeContext = sanitizeGeminiContext(context);

  const prompt = `You are preparing an investor for an upcoming meeting with a startup.

Meeting:
- Startup: ${safeContext.startup_name || "Unknown"}
- Scheduled: ${safeContext.meeting_at || "TBD"}
- Format: ${safeContext.meeting_format || "N/A"}
- Agenda: ${safeContext.agenda || "N/A"}

Startup profile:
${JSON.stringify(safeContext.startup_profile || {}, null, 2)}

Investor connection notes:
${JSON.stringify(safeContext.connection_notes || [], null, 2)}

Pitch deck engagement (this investor):
${JSON.stringify(safeContext.pitch_deck_engagement || {}, null, 2)}

Q&A board:
${JSON.stringify(safeContext.qa_threads || [], null, 2)}

Write a structured meeting preparation brief as JSON only:
{
  "company_overview": "2-3 sentences",
  "recent_activity_and_signals": "paragraph on engagement history and signals",
  "key_questions_to_explore": ["3-5 questions"],
  "suggested_talking_points": ["3-5 talking points"]
}

Be concise, professional, and grounded in the provided data.`;

  try {
    const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await geminiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          thinkingConfig: { thinkingBudget: 0 },
          maxOutputTokens: 900,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const parsed = parseJsonFromGeminiText(extractText(data));
    if (!parsed) return null;

    return {
      company_overview: String(parsed.company_overview || "").trim(),
      recent_activity_and_signals: String(
        parsed.recent_activity_and_signals || "",
      ).trim(),
      key_questions_to_explore: Array.isArray(parsed.key_questions_to_explore)
        ? parsed.key_questions_to_explore
        : [],
      suggested_talking_points: Array.isArray(parsed.suggested_talking_points)
        ? parsed.suggested_talking_points
        : [],
      source: "gemini",
    };
  } catch (error) {
    console.error("Gemini meeting brief failed:", error.message);
    return null;
  }
}
