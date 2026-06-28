import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPitchDeckAnalysisFallback,
  buildFinancialDocAnalysisFallback,
  buildDiscoveryFiltersFallback,
  buildMeetingBriefFallback,
  AI_UNAVAILABLE_MESSAGE,
} from "../utils/aiFallbacks.js";
import { redactPii } from "../utils/geminiSanitize.js";

test("pitch deck fallback marks degraded and includes message", () => {
  const result = buildPitchDeckAnalysisFallback("Acme Inc");
  assert.equal(result.degraded, true);
  assert.equal(result.source, "fallback");
  assert.ok(result.summary.includes("Acme Inc"));
  assert.equal(result.message, AI_UNAVAILABLE_MESSAGE);
});

test("discovery fallback preserves keywords from phrase", () => {
  const result = buildDiscoveryFiltersFallback("fintech startups in London");
  assert.equal(result.keywords, "fintech startups in London");
  assert.equal(result.degraded, true);
});

test("meeting brief fallback returns structured sections", () => {
  const result = buildMeetingBriefFallback({ startup_name: "Acme" });
  assert.ok(result.key_questions_to_explore.length >= 3);
  assert.ok(result.company_overview.includes("Acme"));
});

test("redactPii removes email addresses", () => {
  const out = redactPii("Contact john@example.com today");
  assert.ok(!out.includes("john@example.com"));
  assert.ok(out.includes("redacted"));
});

test("financial doc fallback marks degraded and names the document", () => {
  const result = buildFinancialDocAnalysisFallback("CapTable.pdf", "Acme Inc");
  assert.equal(result.degraded, true);
  assert.equal(result.source, "fallback");
  assert.equal(result.message, AI_UNAVAILABLE_MESSAGE);
  assert.ok(result.summary.includes("CapTable.pdf"));
  assert.ok(result.summary.includes("Acme Inc"));
  assert.ok(Array.isArray(result.key_risks));
});

test("financial doc fallback degrades gracefully with no args", () => {
  const result = buildFinancialDocAnalysisFallback();
  assert.equal(result.degraded, true);
  assert.ok(result.summary.includes("this document"));
});
