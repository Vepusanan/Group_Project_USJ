const DIMENSION_LABELS = {
  industry: "industry focus",
  stage: "company and funding stage",
  geography: "geographic preference",
  investment_size: "typical check size",
  revenue_status: "revenue profile",
};

const describeDimension = (key, score) => {
  const label = DIMENSION_LABELS[key] || key.replace(/_/g, " ");
  if (score >= 80) return `strong ${label} alignment`;
  if (score >= 60) return `moderate ${label} alignment`;
  if (score >= 40) return `partial ${label} alignment`;
  return `limited ${label} alignment`;
};

/**
 * Builds a concise compatibility explanation from rule-based dimension scores.
 */
export const buildMatchExplanation = (matchScore, dimensionScores = {}) => {
  const score = Math.round(Number(matchScore) || 0);
  const entries = Object.entries(dimensionScores || {})
    .map(([key, value]) => [key, Math.round(Number(value) || 0)])
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return `This startup has a ${score}% compatibility score based on your investor profile preferences.`;
  }

  const highlights = entries
    .filter(([, value]) => value >= 60)
    .slice(0, 3)
    .map(([key, value]) => describeDimension(key, value));

  const gaps = entries
    .filter(([, value]) => value < 50)
    .slice(0, 2)
    .map(([key, value]) => describeDimension(key, value));

  let text = `This startup scores ${score}% for compatibility with your investment profile. `;

  if (highlights.length > 0) {
    text += `Key strengths include ${highlights.join(", ")}. `;
  }

  if (gaps.length > 0) {
    text += `Areas with weaker fit: ${gaps.join(", ")}. `;
  }

  text +=
    "The score is calculated from industry, stage, geography, check size, and revenue status relative to your stated preferences.";

  return text;
};

/**
 * Prefer Gemini when GEMINI_API_KEY is set; otherwise use rule-based text.
 */
export const buildMatchExplanationAsync = async ({
  matchScore,
  dimensionScores = {},
  startup = {},
  investor = null,
}) => {
  if (investor && process.env.GEMINI_API_KEY) {
    const { generateGeminiMatchExplanation } = await import("./geminiService.js");
    const aiText = await generateGeminiMatchExplanation({
      matchScore,
      dimensionScores,
      startup,
      investor,
    });
    if (aiText) return aiText;
  }

  return buildMatchExplanation(matchScore, dimensionScores);
};
