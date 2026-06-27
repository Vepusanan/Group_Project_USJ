import { parseInvestmentAmount } from "./parseInvestmentAmount";

/**
 * Build API query params for listing pages.
 * Strips empty values so the backend only receives active filters.
 */
export const omitEmptyParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined,
    ),
  );

export const buildInvestorApiParams = (filters, { page = 1, limit = 9 } = {}) => {
  const investmentMin = parseInvestmentAmount(filters.investment_min);
  const investmentMax = parseInvestmentAmount(filters.investment_max);

  return omitEmptyParams({
    q: filters.q?.trim() || undefined,
    investor_type: filters.investor_type || undefined,
    location: filters.location?.trim() || undefined,
    industries: filters.industries || undefined,
    investment_stage: filters.investment_stage || undefined,
    investment_min: investmentMin != null ? String(investmentMin) : undefined,
    investment_max: investmentMax != null ? String(investmentMax) : undefined,
    connected_only: filters.connected_only ? "true" : undefined,
    sort: filters.connected_only
      ? "connection_recent"
      : filters.sort || "newest",
    page,
    limit,
  });
};

export const buildStartupApiParams = (filters, { page = 1, limit = 9 } = {}) =>
  omitEmptyParams({
    q: filters.q?.trim() || undefined,
    industry: filters.industry || undefined,
    location_country: filters.location_country?.trim() || undefined,
    funding_stage: filters.funding_stage || undefined,
    revenue_status: filters.revenue_status || undefined,
    min_verification: filters.min_verification || undefined,
    connected_only: filters.connected_only ? "true" : undefined,
    sort: filters.connected_only
      ? "connection_recent"
      : filters.sort || "newest",
    page,
    limit,
  });
