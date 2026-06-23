/** Normalize industry/stage tokens for case- and punctuation-insensitive matching. */
export const normalizeFilterToken = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-/]+/g, "");

export const normalizeFilterTokenList = (values = []) =>
  values.map(normalizeFilterToken).filter(Boolean);
