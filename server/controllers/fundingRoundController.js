import { getStartupProfileById, getStartupProfileByUserId } from "../repositories/StartupProfileRepository.js";
import { getConnectionBetweenUsers } from "../repositories/ConnectionRepository.js";
import { canViewProfile } from "../utils/profileVisibility.js";
import {
  ALLOWED_CURRENCIES,
  ALLOWED_FUNDING_STAGES,
  closeFundingRound,
  createFundingRound,
  getActiveFundingRound,
  getFundingRoundById,
  serializeFundingRoundForViewer,
  updateFundingRound,
} from "../repositories/FundingRoundRepository.js";

const parseAmount = (value, label) => {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    const error = new Error(`${label} must be a valid non-negative number`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
};

const parseDate = (value, label) => {
  if (!value) {
    const error = new Error(`${label} is required`);
    error.statusCode = 400;
    throw error;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`${label} must be a valid date`);
    error.statusCode = 400;
    throw error;
  }
  return value.split("T")[0];
};

const assertStartupOwner = async (req) => {
  if (req.user.user_type !== "startup") {
    const error = new Error("Only startup accounts can manage funding rounds");
    error.statusCode = 403;
    throw error;
  }

  const profile = await getStartupProfileByUserId(req.user.id);
  if (!profile) {
    const error = new Error("Startup profile not found");
    error.statusCode = 404;
    throw error;
  }

  return profile;
};

export const resolveFundingRoundVisibility = async ({
  profile,
  requestingUserId,
  requestingUserType,
}) => {
  if (!profile) return { round: null, canViewFinancials: false };

  const round = await getActiveFundingRound(profile.startup_profile_id);
  if (!round) return { round: null, canViewFinancials: false };

  const isOwner =
    requestingUserId &&
    String(profile.user_id) === String(requestingUserId);

  if (isOwner) {
    return { round, canViewFinancials: true };
  }

  if (
    requestingUserId &&
    requestingUserType === "investor" &&
    !isOwner
  ) {
    const connection = await getConnectionBetweenUsers(
      profile.user_id,
      requestingUserId,
    );
    const connected = connection?.normalized_status === "accepted";
    return { round, canViewFinancials: connected };
  }

  return { round, canViewFinancials: false };
};

export const getMyFundingRound = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);
    const round = await getActiveFundingRound(profile.startup_profile_id);

    res.json({
      success: true,
      data: round
        ? serializeFundingRoundForViewer(round, { canViewFinancials: true })
        : null,
    });
  } catch (error) {
    next(error);
  }
};

export const getStartupFundingRound = async (req, res, next) => {
  try {
    const profile = await getStartupProfileById(req.params.startupProfileId);
    if (!profile) {
      return res.status(404).json({ success: false, error: "Startup profile not found" });
    }

    const { canView } = await canViewProfile(profile.user_id, req.user?.id);
    if (!canView) {
      return res.status(403).json({
        success: false,
        error: "This profile is private",
      });
    }

    const { round, canViewFinancials } = await resolveFundingRoundVisibility({
      profile,
      requestingUserId: req.user?.id,
      requestingUserType: req.user?.user_type,
    });

    res.json({
      success: true,
      data: serializeFundingRoundForViewer(round, { canViewFinancials }),
    });
  } catch (error) {
    next(error);
  }
};

export const createFundingRoundHandler = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);

    const fundingStage = String(req.body.funding_stage || "").trim().toUpperCase();
    if (!ALLOWED_FUNDING_STAGES.has(fundingStage)) {
      return res.status(400).json({
        success: false,
        error: "Invalid funding stage. Allowed: PRE_SEED, SEED, SERIES_A, SERIES_B, SERIES_C, SERIES_D_PLUS",
      });
    }

    const currency = String(req.body.currency || "USD").trim().toUpperCase();
    if (!ALLOWED_CURRENCIES.has(currency)) {
      return res.status(400).json({
        success: false,
        error: "Invalid currency. Allowed: USD, EUR, GBP, LKR, AUD, CAD, SGD",
      });
    }

    const targetAmount = parseAmount(req.body.target_amount, "Target amount");
    const committedAmount = parseAmount(
      req.body.committed_amount ?? 0,
      "Committed amount",
    );

    if (committedAmount > targetAmount) {
      return res.status(400).json({
        success: false,
        error: "Committed amount cannot exceed target amount",
      });
    }

    const openingDate = parseDate(req.body.opening_date, "Opening date");
    const targetClosingDate = parseDate(req.body.target_closing_date, "Target closing date");

    if (new Date(targetClosingDate) < new Date(openingDate)) {
      return res.status(400).json({
        success: false,
        error: "Target closing date must be on or after opening date",
      });
    }

    const round = await createFundingRound({
      startupProfileId: profile.startup_profile_id,
      fundingStage,
      targetAmount,
      committedAmount,
      currency,
      openingDate,
      targetClosingDate,
    });

    res.status(201).json({
      success: true,
      data: serializeFundingRoundForViewer(round, { canViewFinancials: true }),
    });
  } catch (error) {
    if (error.code === "ACTIVE_ROUND_EXISTS") {
      return res.status(409).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const updateFundingRoundHandler = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);
    const round = await getFundingRoundById(req.params.roundId);

    if (!round || String(round.startup_profile_id) !== String(profile.startup_profile_id)) {
      return res.status(404).json({ success: false, error: "Funding round not found" });
    }

    if (round.status !== "active") {
      return res.status(400).json({ success: false, error: "Cannot update a closed funding round" });
    }

    const updates = {};

    if (req.body.funding_stage !== undefined) {
      const stage = String(req.body.funding_stage).trim().toUpperCase();
      if (!ALLOWED_FUNDING_STAGES.has(stage)) {
        return res.status(400).json({ success: false, error: "Invalid funding stage" });
      }
      updates.funding_stage = stage;
    }

    if (req.body.currency !== undefined) {
      const currency = String(req.body.currency).trim().toUpperCase();
      if (!ALLOWED_CURRENCIES.has(currency)) {
        return res.status(400).json({ success: false, error: "Invalid currency" });
      }
      updates.currency = currency;
    }

    if (req.body.target_amount !== undefined) {
      updates.target_amount = parseAmount(req.body.target_amount, "Target amount");
    }

    if (req.body.committed_amount !== undefined) {
      updates.committed_amount = parseAmount(req.body.committed_amount, "Committed amount");
    }

    if (req.body.opening_date !== undefined) {
      updates.opening_date = parseDate(req.body.opening_date, "Opening date");
    }

    if (req.body.target_closing_date !== undefined) {
      updates.target_closing_date = parseDate(req.body.target_closing_date, "Target closing date");
    }

    const nextTarget = updates.target_amount ?? Number(round.target_amount);
    const nextCommitted = updates.committed_amount ?? Number(round.committed_amount);

    if (nextCommitted > nextTarget) {
      return res.status(400).json({
        success: false,
        error: "Committed amount cannot exceed target amount",
      });
    }

    const opening = updates.opening_date ?? round.opening_date;
    const closing = updates.target_closing_date ?? round.target_closing_date;
    if (new Date(closing) < new Date(opening)) {
      return res.status(400).json({
        success: false,
        error: "Target closing date must be on or after opening date",
      });
    }

    const updated = await updateFundingRound(round.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Funding round not found or already closed" });
    }

    res.json({
      success: true,
      data: serializeFundingRoundForViewer(updated, { canViewFinancials: true }),
    });
  } catch (error) {
    next(error);
  }
};

export const closeFundingRoundHandler = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);
    const round = await getFundingRoundById(req.params.roundId);

    if (!round || String(round.startup_profile_id) !== String(profile.startup_profile_id)) {
      return res.status(404).json({ success: false, error: "Funding round not found" });
    }

    if (round.status === "closed") {
      return res.status(400).json({ success: false, error: "Funding round is already closed" });
    }

    const closed = await closeFundingRound(round.id);

    res.json({
      success: true,
      data: serializeFundingRoundForViewer(closed, { canViewFinancials: true }),
    });
  } catch (error) {
    next(error);
  }
};

export const fundingRoundErrorHandler = (error, req, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
  }
  next(error);
};
