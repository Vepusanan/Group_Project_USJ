import { StartupProfile } from "../models/StartupProfiles.js";
import { listStartups } from "../repositories/StartupProfileRepository.js";
import { InvestorProfile } from "../models/InvestorProfile.js";
import { listInvestors } from "../repositories/InvestorProfileRepository.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const ALLOWED_SORTS = new Set(["newest", "alphabetical", "recently_updated"]);
const ALLOWED_INVESTOR_SORTS = new Set([
  "newest",
  "alphabetical",
  "most_experienced",
]);

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const buildConnectionStatus = (requestingUserId, startupUserId) => {
  if (!requestingUserId) {
    return null;
  }

  return requestingUserId === startupUserId ? "self" : "not_connected";
};

export const getStartups = async (req, res, next) => {
  try {
    const page = toPositiveInteger(req.query.page, DEFAULT_PAGE);
    const requestedLimit = toPositiveInteger(req.query.limit, DEFAULT_LIMIT);
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const sort = req.query.sort || "newest";

    if (!ALLOWED_SORTS.has(sort)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid sort value. Allowed values: newest, alphabetical, recently_updated",
      });
    }

    const result = await listStartups({
      page,
      limit,
      q: req.query.q,
      industry: req.query.industry,
      location_country: req.query.location_country,
      location_city: req.query.location_city,
      funding_stage: req.query.funding_stage,
      revenue_status: req.query.revenue_status,
      sort,
      requesterUserId: req.user?.id || null,
    });

    const data = result.rows.map((row) => {
      const startup = new StartupProfile(row);
      startup.parseJsonFields(["traction", "social_media"]);

      return {
        ...startup.getPublicFields(),
        connection_status: buildConnectionStatus(
          req.user?.id || null,
          startup.user_id,
        ),
      };
    });

    res.json({
      success: true,
      data,
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      filters: {
        q: req.query.q || null,
        industry: req.query.industry || null,
        location_country: req.query.location_country || null,
        location_city: req.query.location_city || null,
        funding_stage: req.query.funding_stage || null,
        revenue_status: req.query.revenue_status || null,
        sort,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInvestors = async (req, res, next) => {
  try {
    const page = toPositiveInteger(req.query.page, DEFAULT_PAGE);
    const requestedLimit = toPositiveInteger(req.query.limit, DEFAULT_LIMIT);
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const sort = req.query.sort || "newest";

    if (!ALLOWED_INVESTOR_SORTS.has(sort)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid sort value. Allowed values: newest, alphabetical, most_experienced",
      });
    }

    const investment_min =
      req.query.investment_min != null && req.query.investment_min !== ""
        ? Number.parseInt(req.query.investment_min, 10) || null
        : null;
    const investment_max =
      req.query.investment_max != null && req.query.investment_max !== ""
        ? Number.parseInt(req.query.investment_max, 10) || null
        : null;

    const result = await listInvestors({
      page,
      limit,
      q: req.query.q,
      investor_type: req.query.investor_type,
      location: req.query.location,
      industries: req.query.industries,
      investment_stage: req.query.investment_stage,
      investment_min,
      investment_max,
      sort,
      requesterUserId: req.user?.id || null,
    });

    const data = result.rows.map((row) => {
      const investor = new InvestorProfile(row);
      return {
        ...investor.getPublicFields(),
        connection_status: buildConnectionStatus(
          req.user?.id || null,
          investor.user_id,
        ),
      };
    });

    res.json({
      success: true,
      data,
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      filters: {
        q: req.query.q || null,
        investor_type: req.query.investor_type || null,
        location: req.query.location || null,
        industries: req.query.industries || null,
        investment_stage: req.query.investment_stage || null,
        investment_min: investment_min,
        investment_max: investment_max,
        sort,
      },
    });
  } catch (error) {
    next(error);
  }
};
