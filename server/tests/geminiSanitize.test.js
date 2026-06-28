// Tests for the Gemini PII-sanitisation layer (NFR 17.2 / 2.3).
//
// This is the privacy boundary: anything sent to Gemini must have emails and
// phone numbers stripped, recursively, across the structured context the AI
// callers pass in. These tests pin that behaviour so a refactor can't silently
// start leaking PII to a third-party API.

import test from "node:test";
import assert from "node:assert/strict";
import { redactPii, sanitizeGeminiContext } from "../utils/geminiSanitize.js";

test("redactPii strips email addresses", () => {
  const out = redactPii("Contact me at jane.doe@example.com please");
  assert.match(out, /\[email redacted\]/);
  assert.doesNotMatch(out, /example\.com/);
});

test("redactPii strips phone numbers", () => {
  const out = redactPii("Call +1 (415) 555-2671 today");
  assert.match(out, /\[phone redacted\]/);
  assert.doesNotMatch(out, /555/);
});

test("redactPii passes through null/undefined unchanged", () => {
  assert.equal(redactPii(null), null);
  assert.equal(redactPii(undefined), undefined);
});

test("redactPii coerces non-strings to string before redacting", () => {
  // numbers have no PII but must not throw
  assert.equal(redactPii(42), "42");
});

test("sanitizeGeminiContext redacts flat free-text keys", () => {
  const out = sanitizeGeminiContext({
    agenda: "ping me at founder@startup.io",
    investment_thesis: "reach me on +44 7700 900123",
    industry: "FinTech", // not a redaction target — left intact
  });
  assert.match(out.agenda, /\[email redacted\]/);
  assert.match(out.investment_thesis, /\[phone redacted\]/);
  assert.equal(out.industry, "FinTech");
});

test("sanitizeGeminiContext redacts recentNotes arrays (strings and objects)", () => {
  const out = sanitizeGeminiContext({
    recentNotes: [
      "email a@b.com",
      { body: "call 415-555-2671", author: "Investor" },
    ],
  });
  assert.match(out.recentNotes[0], /\[email redacted\]/);
  assert.match(out.recentNotes[1].body, /\[phone redacted\]/);
  assert.equal(out.recentNotes[1].author, "Investor");
});

test("sanitizeGeminiContext deep-redacts nested objects/arrays", () => {
  const out = sanitizeGeminiContext({
    startup_profile: {
      contact: "founder@acme.com",
      team: [{ name: "A", phone: "+1 212 555 0000" }],
    },
  });
  assert.match(out.startup_profile.contact, /\[email redacted\]/);
  assert.match(out.startup_profile.team[0].phone, /\[phone redacted\]/);
  assert.equal(out.startup_profile.team[0].name, "A");
});

test("sanitizeGeminiContext does not mutate the original input object", () => {
  const input = { agenda: "mail me x@y.com" };
  sanitizeGeminiContext(input);
  // top-level is shallow-copied, so the caller's object keeps raw text
  assert.equal(input.agenda, "mail me x@y.com");
});

test("sanitizeGeminiContext tolerates an empty/missing context", () => {
  assert.deepEqual(sanitizeGeminiContext(), {});
  assert.deepEqual(sanitizeGeminiContext({}), {});
});
