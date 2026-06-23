import { normalizeFilterToken } from "./filterNormalize.js";

const NEUTRAL_SCORE = 70;

const GLOBAL_GEO_TERMS = new Set([
  "global",
  "worldwide",
  "any",
  "anywhere",
  "allregions",
]);

const FUNDING_STAGES = new Set([
  "PRE_SEED",
  "SEED",
  "SERIES_A",
  "SERIES_B",
  "SERIES_C",
  "SERIES_D_PLUS",
]);

const COMPANY_STAGES = new Set([
  "IDEA",
  "MVP",
  "EARLY_REVENUE",
  "GROWTH",
  "SCALING",
]);

const REVENUE_STATUSES = new Set([
  "PRE_REVENUE",
  "REVENUE_GENERATING",
  "PROFITABLE",
]);

const REVENUE_KEYWORDS = {
  PRE_REVENUE: ["prerevenue", "pre revenue", "no revenue", "pre-revenue"],
  REVENUE_GENERATING: [
    "revenue generating",
    "revenuegenerating",
    "generating revenue",
    "early revenue",
    "earlyrevenue",
    "has revenue",
  ],
  PROFITABLE: ["profitable", "profitability", "profits", "profit positive"],
};

const STAGE_REVENUE_ALIGNMENT = {
  IDEA: new Set(["PRE_REVENUE"]),
  MVP: new Set(["PRE_REVENUE", "REVENUE_GENERATING"]),
  EARLY_REVENUE: new Set(["REVENUE_GENERATING", "PROFITABLE"]),
  GROWTH: new Set(["REVENUE_GENERATING", "PROFITABLE"]),
  SCALING: new Set(["REVENUE_GENERATING", "PROFITABLE"]),
};

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [trimmed];
    } catch {
      return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

const toNumber = (value) => {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-/]+/g, "");

const tokensMatch = (left, right) => {
  const a = normalizeFilterToken(left);
  const b = normalizeFilterToken(right);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
};

const scoreIndustry = (startup, investor) => {
  const preferences = parseJsonArray(investor.industries_of_interest);
  if (preferences.length === 0) return NEUTRAL_SCORE;

  const startupIndustry = startup.industry;
  if (!startupIndustry) return 0;

  const matched = preferences.some((pref) => tokensMatch(pref, startupIndustry));
  return matched ? 100 : 0;
};

const scoreStage = (startup, investor) => {
  const preferences = parseJsonArray(investor.stage_preference).map((value) =>
    String(value || "").trim().toUpperCase(),
  );
  if (preferences.length === 0) return NEUTRAL_SCORE;

  const fundingStage = String(startup.funding_stage || "").toUpperCase();
  const currentStage = String(startup.current_stage || "").toUpperCase();

  if (fundingStage && preferences.includes(fundingStage)) return 100;
  if (currentStage && preferences.includes(currentStage)) return 95;

  const fundingIndex = [...FUNDING_STAGES].indexOf(fundingStage);
  const nearestFunding = preferences
    .filter((value) => FUNDING_STAGES.has(value))
    .map((value) => [...FUNDING_STAGES].indexOf(value))
    .filter((index) => index >= 0);

  if (fundingIndex >= 0 && nearestFunding.length > 0) {
    const distance = Math.min(
      ...nearestFunding.map((index) => Math.abs(index - fundingIndex)),
    );
    if (distance === 1) return 60;
    if (distance === 2) return 35;
  }

  const companyPrefs = preferences.filter((value) => COMPANY_STAGES.has(value));
  if (currentStage && companyPrefs.length > 0 && !companyPrefs.includes(currentStage)) {
    return 20;
  }

  return 0;
};

const locationMatchesPreference = (startup, preference) => {
  const normalizedPref = normalizeText(preference);
  if (!normalizedPref) return false;
  if (GLOBAL_GEO_TERMS.has(normalizedPref)) return true;

  const country = normalizeText(startup.location_country || startup.country);
  const city = normalizeText(startup.location_city || startup.city);

  return (
    (country && (country.includes(normalizedPref) || normalizedPref.includes(country))) ||
    (city && (city.includes(normalizedPref) || normalizedPref.includes(city)))
  );
};

const scoreGeography = (startup, investor) => {
  const preferences = parseJsonArray(investor.geographic_preference);
  if (preferences.length === 0) return NEUTRAL_SCORE;

  const hasGlobal = preferences.some((pref) =>
    GLOBAL_GEO_TERMS.has(normalizeText(pref)),
  );
  if (hasGlobal) return 100;

  const matched = preferences.some((pref) =>
    locationMatchesPreference(startup, pref),
  );
  if (matched) return 100;

  const investorCountry = normalizeText(investor.location_country);
  const investorCity = normalizeText(investor.location_city);
  const startupCountry = normalizeText(startup.location_country || startup.country);
  const startupCity = normalizeText(startup.location_city || startup.city);

  if (
    (investorCountry && startupCountry && investorCountry === startupCountry) ||
    (investorCity && startupCity && investorCity === startupCity)
  ) {
    return 75;
  }

  return 0;
};

const scoreInvestmentSize = (startup, investor) => {
  const amountSeeking = toNumber(startup.amount_seeking);
  const minInvestment = toNumber(investor.min_investment_size);
  const maxInvestment = toNumber(investor.max_investment_size);

  if (minInvestment == null && maxInvestment == null) return NEUTRAL_SCORE;
  if (amountSeeking == null) return NEUTRAL_SCORE;

  const min = minInvestment ?? 0;
  const max = maxInvestment ?? Number.MAX_SAFE_INTEGER;

  if (amountSeeking >= min && amountSeeking <= max) return 100;

  const distance =
    amountSeeking < min
      ? min - amountSeeking
      : amountSeeking > max
        ? amountSeeking - max
        : 0;
  const reference = amountSeeking < min ? Math.max(min, 1) : Math.max(max, 1);
  const distanceRatio = distance / reference;

  if (distanceRatio <= 0.15) return 65;
  if (distanceRatio <= 0.35) return 40;
  if (distanceRatio <= 0.6) return 20;
  return 0;
};

const detectRevenuePreference = (investor) => {
  const text = normalizeText(
    `${investor.what_you_look_for || ""} ${investor.deal_breakers || ""}`,
  );
  const preferred = new Set();
  const rejected = new Set();

  for (const [status, keywords] of Object.entries(REVENUE_KEYWORDS)) {
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeText(keyword);
      if (!normalizedKeyword || !text.includes(normalizedKeyword)) continue;

      if ((investor.deal_breakers || "").toLowerCase().includes(keyword)) {
        rejected.add(status);
      } else {
        preferred.add(status);
      }
    }
  }

  const stagePreferences = parseJsonArray(investor.stage_preference).map((value) =>
    String(value || "").trim().toUpperCase(),
  );

  for (const stage of stagePreferences) {
    const aligned = STAGE_REVENUE_ALIGNMENT[stage];
    if (!aligned) continue;
    aligned.forEach((status) => preferred.add(status));
  }

  return { preferred: [...preferred], rejected: [...rejected] };
};

const scoreRevenueStatus = (startup, investor) => {
  const startupRevenue = String(startup.revenue_status || "").toUpperCase();
  if (!REVENUE_STATUSES.has(startupRevenue)) return NEUTRAL_SCORE;

  const { preferred, rejected } = detectRevenuePreference(investor);

  if (rejected.includes(startupRevenue)) return 0;
  if (preferred.length === 0) return NEUTRAL_SCORE;
  if (preferred.includes(startupRevenue)) return 100;

  return 25;
};

/**
 * Rule-based compatibility score across five dimensions.
 * Returns overall percentage (0-100) and per-dimension breakdown.
 */
export const calculateCompatibilityScore = (startup = {}, investor = {}) => {
  const dimensions = {
    industry: scoreIndustry(startup, investor),
    stage: scoreStage(startup, investor),
    geography: scoreGeography(startup, investor),
    investment_size: scoreInvestmentSize(startup, investor),
    revenue_status: scoreRevenueStatus(startup, investor),
  };

  const values = Object.values(dimensions);
  const match_score = Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );

  return {
    match_score,
    dimension_scores: dimensions,
  };
};
