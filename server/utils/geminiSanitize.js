const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/g;

export const redactPii = (text) => {
  if (text == null) return text;
  return String(text)
    .replace(EMAIL_RE, "[email redacted]")
    .replace(PHONE_RE, "[phone redacted]");
};

const deepRedactPii = (value) => {
  if (value == null) return value;
  if (typeof value === "string") return redactPii(value);
  if (Array.isArray(value)) return value.map(deepRedactPii);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, deepRedactPii(val)]),
    );
  }
  return value;
};

export const sanitizeGeminiContext = (context = {}) => {
  const sanitized = { ...context };

  for (const key of [
    "agenda",
    "message",
    "notes",
    "connectionNotes",
    "qaThread",
    "professional_background",
    "investment_thesis",
  ]) {
    if (sanitized[key] != null) {
      sanitized[key] = redactPii(sanitized[key]);
    }
  }

  if (Array.isArray(sanitized.recentNotes)) {
    sanitized.recentNotes = sanitized.recentNotes.map((note) =>
      typeof note === "string" ? redactPii(note) : deepRedactPii(note),
    );
  }

  for (const nestedKey of [
    "startup_profile",
    "connection_notes",
    "pitch_deck_engagement",
    "qa_threads",
    "startup",
    "investor",
  ]) {
    if (sanitized[nestedKey] != null) {
      sanitized[nestedKey] = deepRedactPii(sanitized[nestedKey]);
    }
  }

  return sanitized;
};
