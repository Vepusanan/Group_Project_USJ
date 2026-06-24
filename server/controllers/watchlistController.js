import {
  addToWatchlist,
  listWatchlistForInvestor,
  removeFromWatchlist,
} from "../repositories/WatchlistRepository.js";
import { getStartupProfileById } from "../repositories/StartupProfileRepository.js";
import { canViewProfile } from "../utils/profileVisibility.js";
import { getMatchScoresForInvestor } from "../repositories/CompatibilityMatchScoreRepository.js";
import { getConnectionStatusesForStartups } from "../repositories/StartupProfileRepository.js";
import { getProfileIntent } from "../repositories/InvestorProfileIntentRepository.js";

const assertInvestor = (req) => {
  if (req.user.user_type !== "investor") {
    const error = new Error("Only investors can manage a watchlist");
    error.statusCode = 403;
    throw error;
  }
};

export const getMyWatchlist = async (req, res, next) => {
  try {
    assertInvestor(req);
    const items = await listWatchlistForInvestor(req.user.id);
    const startupProfileIds = items.map((item) => item.startup_profile_id);
    const startupUserIds = items.map((item) => item.startup_user_id);

    const [scoreMap, connectionMap] = await Promise.all([
      getMatchScoresForInvestor(req.user.id, startupProfileIds),
      getConnectionStatusesForStartups(req.user.id, startupUserIds),
    ]);

    const enriched = await Promise.all(
      items.map(async (item) => {
        const scoreEntry = scoreMap.get(String(item.startup_profile_id));
        const conn = connectionMap.get(String(item.startup_user_id));
        const connStatus =
          conn?.status && ["accepted", "connected"].includes(
            String(conn.status).toLowerCase(),
          )
            ? "accepted"
            : conn?.status || "not_connected";

        let profileIntent = null;
        if (connStatus !== "accepted") {
          const intent = await getProfileIntent(
            req.user.id,
            item.startup_profile_id,
          );
          profileIntent = intent?.intent_level || null;
        }

        const matchScore = scoreEntry?.match_score ?? null;

        return {
          ...item,
          match_score: matchScore,
          connection_status: connStatus,
          connection_id: conn?.connection_id || null,
          profile_intent_level: profileIntent,
        };
      }),
    );

    res.json({ success: true, data: enriched });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

export const addWatchlistItem = async (req, res, next) => {
  try {
    assertInvestor(req);
    const startupProfileId = req.body.startup_profile_id;
    if (!startupProfileId) {
      return res.status(400).json({
        success: false,
        error: "startup_profile_id is required",
      });
    }

    const profile = await getStartupProfileById(startupProfileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Startup profile not found",
      });
    }

    const { canView } = await canViewProfile(profile.user_id, req.user.id);
    if (!canView) {
      return res.status(403).json({
        success: false,
        error: "This profile is private",
      });
    }

    const item = await addToWatchlist(req.user.id, startupProfileId);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

export const removeWatchlistItem = async (req, res, next) => {
  try {
    assertInvestor(req);
    const removed = await removeFromWatchlist(
      req.user.id,
      req.params.startupProfileId,
    );
    if (!removed) {
      return res.status(404).json({
        success: false,
        error: "Startup not on your watchlist",
      });
    }
    res.json({ success: true });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};
