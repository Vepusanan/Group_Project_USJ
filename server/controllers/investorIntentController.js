import {
  assertInvestorOwnsConnection,
  deleteInvestorIntent,
  getIntentMapForInvestor,
  INTENT_LEVEL_SET,
  upsertInvestorIntent,
} from "../repositories/InvestorIntentRepository.js";
import {
  deleteProfileIntent,
  getProfileIntent,
  PROFILE_INTENT_SET,
  upsertProfileIntent,
} from "../repositories/InvestorProfileIntentRepository.js";
import {
  passStartupForInvestor,
  removePassedStartup,
} from "../repositories/InvestorPassedRepository.js";
import { getStartupProfileById } from "../repositories/StartupProfileRepository.js";
import { advancePipelineStageIfEligible } from "../services/pipelineStageService.js";

const assertInvestor = (req) => {
  if (req.user.user_type !== "investor") {
    const error = new Error("Only investors can manage intent levels");
    error.statusCode = 403;
    throw error;
  }
};

export const listMyIntents = async (req, res, next) => {
  try {
    assertInvestor(req);

    const intentMap = await getIntentMapForInvestor(req.user.id);
    const data = Object.fromEntries(intentMap);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const setConnectionIntent = async (req, res, next) => {
  try {
    assertInvestor(req);

    const connectionId = req.params.connectionId;
    const rawLevel = req.body.intent_level;

    if (rawLevel === null || rawLevel === "" || rawLevel === undefined) {
      await deleteInvestorIntent(req.user.id, connectionId);
      return res.json({ success: true, data: { connection_id: connectionId, intent_level: null } });
    }

    const intentLevel = String(rawLevel).trim().toUpperCase();
    if (!INTENT_LEVEL_SET.has(intentLevel)) {
      return res.status(400).json({
        success: false,
        error: "Invalid intent level. Allowed: WATCHING, INTERESTED, PASSED",
      });
    }

    const connection = await assertInvestorOwnsConnection(req.user.id, connectionId);
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: "Accepted connection with this startup not found",
      });
    }

    const row = await upsertInvestorIntent({
      investorUserId: req.user.id,
      connectionId,
      startupProfileId: connection.startup_profile_id,
      intentLevel,
    });

    if (intentLevel === "PASSED") {
      await advancePipelineStageIfEligible({
        investorUserId: req.user.id,
        connectionId,
        startupProfileId: connection.startup_profile_id,
        targetStage: "ARCHIVED",
      });
    }

    if (!row) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to set intent for this connection",
      });
    }

    res.json({
      success: true,
      data: {
        connection_id: connectionId,
        intent_level: row.intent_level,
        updated_at: row.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const setProfileIntent = async (req, res, next) => {
  try {
    assertInvestor(req);

    const startupProfileId = req.params.startupProfileId;
    const startup = await getStartupProfileById(startupProfileId);
    if (!startup) {
      return res.status(404).json({
        success: false,
        error: "Startup profile not found",
      });
    }

    const rawLevel = req.body.intent_level;
    if (rawLevel === null || rawLevel === "" || rawLevel === undefined) {
      await deleteProfileIntent(req.user.id, startupProfileId);
      return res.json({
        success: true,
        data: { startup_profile_id: startupProfileId, intent_level: null },
      });
    }

    const intentLevel = String(rawLevel).trim().toUpperCase();
    if (!PROFILE_INTENT_SET.has(intentLevel)) {
      return res.status(400).json({
        success: false,
        error: "Invalid intent level. Allowed: WATCHING, INTERESTED",
      });
    }

    const row = await upsertProfileIntent({
      investorUserId: req.user.id,
      startupProfileId,
      intentLevel,
    });

    res.json({
      success: true,
      data: {
        startup_profile_id: startupProfileId,
        intent_level: row.intent_level,
        updated_at: row.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const passStartupFromDiscovery = async (req, res, next) => {
  try {
    assertInvestor(req);

    const startupProfileId = req.params.startupProfileId;
    const startup = await getStartupProfileById(startupProfileId);
    if (!startup) {
      return res.status(404).json({
        success: false,
        error: "Startup profile not found",
      });
    }

    await deleteProfileIntent(req.user.id, startupProfileId);
    const row = await passStartupForInvestor(req.user.id, startupProfileId);

    res.json({
      success: true,
      data: {
        startup_profile_id: startupProfileId,
        passed_at: row?.passed_at || null,
        intent_level: "PASSED",
      },
      message: "Startup archived — it will no longer appear in your discovery feed.",
    });
  } catch (error) {
    next(error);
  }
};

export const unpassStartupFromDiscovery = async (req, res, next) => {
  try {
    assertInvestor(req);

    const startupProfileId = req.params.startupProfileId;
    const removed = await removePassedStartup(req.user.id, startupProfileId);

    if (!removed) {
      return res.status(404).json({
        success: false,
        error: "Passed record not found",
      });
    }

    res.json({
      success: true,
      message: "Startup restored to discovery feed",
    });
  } catch (error) {
    next(error);
  }
};

export const investorIntentErrorHandler = (error, req, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
  }
  next(error);
};
