import { StartupProfile } from "../models/StartupProfiles.js";
import {
  getConnectionStatusesForStartups,
  listStartups,
} from "../repositories/StartupProfileRepository.js";
import { InvestorProfile } from "../models/InvestorProfile.js";
import {
  getConnectionStatusesForInvestors,
  listInvestors,
} from "../repositories/InvestorProfileRepository.js";
import { parseInvestmentAmount } from "../utils/parseInvestmentAmount.js";
import {
  getMatchScoreMapForInvestor,
  scheduleInvestorMatchScores,
} from "../services/compatibilityMatchService.js";
import { getWatchlistIdsForInvestor } from "../repositories/WatchlistRepository.js";

const ALLOWED_MIN_VERIFICATION = new Set([
  "IDENTITY_VERIFIED",
  "BUSINESS_VERIFIED",
]);

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const ALLOWED_SORTS = new Set([
  "newest",
  "alphabetical",
  "recently_updated",
  "match_score",
  "connection_recent",
]);
const ALLOWED_INVESTOR_SORTS = new Set([
  "newest",
  "alphabetical",
  "most_experienced",
  "connection_recent",
]);

const isTruthyParam = (value) =>
  value === true || value === "true" || value === "1";

const ALLOWED_INVESTOR_TYPES = new Set([
  "ANGEL",
  "VC_FIRM",
  "CORPORATE_VC",
  "FAMILY_OFFICE",
  "ACCELERATOR",
  "INCUBATOR",
  "PRIVATE_EQUITY",
]);

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const buildConnectionStatus = (
  requestingUserId,
  startupUserId,
  connectionStatusMap = new Map(),
) => {
  if (!requestingUserId) {
    return null;
  }

  if (requestingUserId === startupUserId) {
    return "self";
  }

  return connectionStatusMap.get(startupUserId) || "not_connected";
};

export const getStartups = async (req, res, next) => {
  try {
    const page = toPositiveInteger(req.query.page, DEFAULT_PAGE);
    const requestedLimit = toPositiveInteger(req.query.limit, DEFAULT_LIMIT);
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const isInvestorViewer = req.user?.user_type === "investor";
    const investorUserIdForScoring = isInvestorViewer ? req.user.id : null;
    // Connected-only requires a logged-in viewer and forces the most-recent
    // connection sort.
    const connectedOnly = isTruthyParam(req.query.connected_only) && !!req.user;
    const sort = connectedOnly
      ? "connection_recent"
      : req.query.sort || (isInvestorViewer ? "match_score" : "newest");

    if (!ALLOWED_SORTS.has(sort)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid sort value. Allowed values: newest, alphabetical, recently_updated, match_score",
      });
    }

    if (sort === "match_score" && !isInvestorViewer) {
      return res.status(403).json({
        success: false,
        error: "Match score sorting is available to investors only.",
      });
    }

    const minVerification = req.query.min_verification
      ? String(req.query.min_verification).toUpperCase()
      : null;

    if (minVerification && !ALLOWED_MIN_VERIFICATION.has(minVerification)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid min_verification. Use IDENTITY_VERIFIED or BUSINESS_VERIFIED",
      });
    }

    if (isInvestorViewer) {
      scheduleInvestorMatchScores(req.user.id);
    }

    const result = await listStartups({
      page,
      limit,
      q: req.query.q,
      industry: req.query.industry,
      current_stage: req.query.current_stage,
      funding_stage: req.query.funding_stage,
      revenue_status: req.query.revenue_status,
      location_country: req.query.location_country,
      min_verification: minVerification,
      sort,
      requesterUserId: req.user?.id || null,
      investorUserIdForScoring,
      excludePassedForInvestorId: isInvestorViewer ? req.user.id : null,
      connectedOnly,
    });

    const matchScoreMap = isInvestorViewer
      ? await getMatchScoreMapForInvestor(req.user.id, result.rows)
      : new Map();

    const startupUserIds = result.rows.map((row) => row.user_id);
    const startupProfileIds = result.rows.map((row) => row.startup_profile_id);

    const [connectionStatusMap, watchlistIds] = await Promise.all([
      getConnectionStatusesForStartups(req.user?.id || null, startupUserIds),
      isInvestorViewer
        ? getWatchlistIdsForInvestor(req.user.id, startupProfileIds)
        : Promise.resolve(new Set()),
    ]);

    const data = result.rows.map((row) => {
      const startup = new StartupProfile(row);
      startup.parseJsonFields(["social_media_links"]);

      const userId = req.user?.id || null;
      const connEntry = connectionStatusMap.get(String(startup.user_id));
      const connStatus = userId && String(startup.user_id) === String(userId)
        ? "self"
        : connEntry?.status || (userId ? "not_connected" : null);

      const response = {
        ...startup.getPublicFields(),
        logo_url: row.logo_url || null,
        verification_tier: row.verification_tier || "UNVERIFIED",
        connection_status: connStatus,
        connection_id: connEntry?.connection_id || null,
        connection_requester_id: connEntry?.requester_id || null,
        connection_declined_at: connEntry?.declined_at || null,
      };

      if (isInvestorViewer) {
        const scoreEntry = matchScoreMap.get(String(startup.startup_profile_id));
        const matchScore =
          scoreEntry?.match_score ?? row.match_score ?? null;
        response.match_score = matchScore;
        response.is_watchlisted = watchlistIds.has(
          String(startup.startup_profile_id),
        );
      }

      return response;
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
    const connectedOnly = isTruthyParam(req.query.connected_only) && !!req.user;
    const sort = connectedOnly
      ? "connection_recent"
      : req.query.sort || "newest";

    if (!ALLOWED_INVESTOR_SORTS.has(sort)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid sort value. Allowed values: newest, alphabetical, most_experienced",
      });
    }

    const investorTypeRaw = String(req.query.investor_type || "").trim();
    const investor_type = investorTypeRaw
      ? investorTypeRaw.toUpperCase()
      : null;

    if (investor_type && !ALLOWED_INVESTOR_TYPES.has(investor_type)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid investor type. Allowed values: ANGEL, VC_FIRM, CORPORATE_VC, FAMILY_OFFICE, ACCELERATOR, INCUBATOR, PRIVATE_EQUITY",
      });
    }

    const investment_min = parseInvestmentAmount(req.query.investment_min);
    const investment_max = parseInvestmentAmount(req.query.investment_max);

    if (
      investment_min != null &&
      investment_max != null &&
      investment_min > investment_max
    ) {
      return res.status(400).json({
        success: false,
        error: "Check size minimum cannot be greater than maximum.",
      });
    }

    const result = await listInvestors({
      page,
      limit,
      q: req.query.q,
      investor_type,
      location: req.query.location,
      industries: req.query.industries,
      investment_stage: req.query.investment_stage,
      investment_min,
      investment_max,
      sort,
      requesterUserId: req.user?.id || null,
      connectedOnly,
    });

    const investorUserIds = result.rows.map((row) => row.user_id);
    const connectionStatusMap = await getConnectionStatusesForInvestors(
      req.user?.id || null,
      investorUserIds,
    );

    const data = result.rows.map((row) => {
      const investor = new InvestorProfile(row);
      const userId = req.user?.id || null;
      const connEntry = connectionStatusMap.get(String(investor.user_id));
      const connStatus = userId && String(investor.user_id) === String(userId)
        ? "self"
        : connEntry?.status || (userId ? "not_connected" : null);
      return {
        ...investor.getPublicFields(),
        photo_url: row.photo_url || null,
        verification_tier: row.verification_tier || "UNVERIFIED",
        connection_status: connStatus,
        connection_id: connEntry?.connection_id || null,
        connection_requester_id: connEntry?.requester_id || null,
        connection_declined_at: connEntry?.declined_at || null,
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

const STAGE_LABELS = {
  PRE_SEED: "Pre-seed",
  SEED: "Seed",
  SERIES_A: "Series A",
  SERIES_B: "Series B",
  SERIES_C: "Series C",
  SERIES_D_PLUS: "Series D+",
};

const REVENUE_LABELS = {
  PRE_REVENUE: "Pre-revenue",
  REVENUE_GENERATING: "Revenue-generating",
  PROFITABLE: "Profitable",
};

export const parseNaturalLanguageSearch = async (req, res, next) => {
  try {
    if (req.user?.user_type !== "investor") {
      return res.status(403).json({
        success: false,
        error: "Natural language discovery search is available to investors only",
      });
    }

    const phrase = String(req.body.phrase || "").trim();
    if (!phrase) {
      return res.status(400).json({
        success: false,
        error: "Search phrase is required",
      });
    }

    const { generateGeminiDiscoveryFilters } = await import(
      "../utils/geminiService.js"
    );
    const parsed = await generateGeminiDiscoveryFilters(phrase);

    const { buildDiscoveryFiltersFallback } = await import(
      "../utils/aiFallbacks.js"
    );
    const resolved = parsed || buildDiscoveryFiltersFallback(phrase);

    const applied = {
      industry: resolved.industry || "",
      location_country: resolved.location_country || "",
      funding_stage: resolved.funding_stage || "",
      revenue_status: resolved.revenue_status || "",
      q: resolved.keywords || "",
    };

    const summaryParts = [];
    if (applied.industry) summaryParts.push(`Industry: ${applied.industry}`);
    if (applied.location_country) {
      summaryParts.push(`Geography: ${applied.location_country}`);
    }
    if (applied.funding_stage) {
      summaryParts.push(
        `Stage: ${STAGE_LABELS[applied.funding_stage] || applied.funding_stage}`,
      );
    }
    if (applied.revenue_status) {
      summaryParts.push(
        `Revenue: ${REVENUE_LABELS[applied.revenue_status] || applied.revenue_status}`,
      );
    }
    if (resolved.max_amount) {
      summaryParts.push(`Max raise: $${resolved.max_amount.toLocaleString()}`);
    }
    if (applied.q) summaryParts.push(`Keywords: ${applied.q}`);

    res.json({
      success: true,
      data: {
        phrase,
        filters: applied,
        parsed: resolved,
        applied_summary:
          summaryParts.length > 0
            ? summaryParts.join(" · ")
            : "No specific filters extracted — showing all startups",
        unsupported: resolved.max_amount
          ? { max_amount: resolved.max_amount }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};
