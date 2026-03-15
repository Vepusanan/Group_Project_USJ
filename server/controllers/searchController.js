import { StartupProfile } from "../models/StartupProfiles.js";
import { listStartups } from "../repositories/StartupProfileRepository.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const ALLOWED_SORTS = new Set(["newest", "alphabetical", "recently_updated"]);

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
