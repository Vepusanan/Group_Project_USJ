import { getStartupProfileById } from "../repositories/StartupProfileRepository.js";
import { canViewProfile } from "../utils/profileVisibility.js";
import {
  advancePipelineStageIfEligible,
  getConnectionIdForInvestorAndStartup,
} from "../services/pipelineStageService.js";
import {
  createPitchDeckViewSession,
  getPitchDeckViewSessionById,
  updatePitchDeckViewSession,
} from "../repositories/PitchDeckViewSessionRepository.js";
import { buildPitchDeckAnalysisFallback } from "../utils/aiFallbacks.js";
import { generateGeminiPitchDeckAnalysis } from "../utils/geminiService.js";
import { isDeckFullyViewed } from "../utils/pitchDeckEngagement.js";
import {
  fetchDeckBuffer,
  fetchDeckUpstream,
  streamDeckToResponse,
} from "../utils/pitchDeckFetch.js";
import {
  parseStoredJson,
  sanitizeSessionPayload,
} from "../utils/pitchDeckSessionPayload.js";

const isPdfUrl = (url) => /\.pdf($|\?)/i.test(String(url || ""));

const assertPitchDeckAccess = async (req, startupProfileId) => {
  const profile = await getStartupProfileById(startupProfileId);
  if (!profile) {
    const error = new Error("Startup profile not found");
    error.statusCode = 404;
    throw error;
  }

  if (!profile.pitch_deck_url) {
    const error = new Error("No pitch deck available for this startup");
    error.statusCode = 404;
    throw error;
  }

  const userId = req.user.id;
  const isOwner = String(profile.user_id) === String(userId);

  if (isOwner) {
    return profile;
  }

  if (req.user.user_type !== "investor") {
    const error = new Error(
      "Only investors and the startup owner can view pitch decks",
    );
    error.statusCode = 403;
    throw error;
  }

  const { canView } = await canViewProfile(profile.user_id, userId);
  if (!canView) {
    const error = new Error(
      "You do not have permission to view this pitch deck",
    );
    error.statusCode = 403;
    throw error;
  }

  return profile;
};

const assertSessionOwner = async (req, sessionId) => {
  const session = await getPitchDeckViewSessionById(sessionId);
  if (!session) {
    const error = new Error("Viewing session not found");
    error.statusCode = 404;
    throw error;
  }

  if (String(session.investor_user_id) !== String(req.user.id)) {
    const error = new Error("Not authorized to update this viewing session");
    error.statusCode = 403;
    throw error;
  }

  return session;
};

export const getPitchDeckMeta = async (req, res, next) => {
  try {
    const profile = await assertPitchDeckAccess(req, req.params.startupProfileId);

    res.json({
      success: true,
      data: {
        startup_profile_id: profile.startup_profile_id,
        company_name: profile.company_name,
        has_pitch_deck: Boolean(profile.pitch_deck_url),
        is_pdf: isPdfUrl(profile.pitch_deck_url),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const streamPitchDeck = async (req, res, next) => {
  try {
    const profile = await assertPitchDeckAccess(req, req.params.startupProfileId);
    const upstream = await fetchDeckUpstream(profile.pitch_deck_url);
    await streamDeckToResponse(upstream, res);
  } catch (error) {
    next(error);
  }
};

export const startPitchDeckSession = async (req, res, next) => {
  try {
    if (req.user.user_type !== "investor") {
      return res.status(403).json({
        success: false,
        error: "Only investors can record pitch deck viewing sessions",
      });
    }

    const profile = await assertPitchDeckAccess(req, req.params.startupProfileId);

    const session = await createPitchDeckViewSession(
      req.user.id,
      req.params.startupProfileId,
    );

    const connectionId = await getConnectionIdForInvestorAndStartup(
      req.user.id,
      profile.user_id,
    );
    if (connectionId) {
      advancePipelineStageIfEligible({
        investorUserId: req.user.id,
        connectionId,
        startupProfileId: profile.startup_profile_id,
        targetStage: "REVIEWING",
      }).catch(() => undefined);
    }

    res.status(201).json({
      success: true,
      data: {
        session_id: session.id,
        started_at: session.started_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePitchDeckSession = async (req, res, next) => {
  try {
    await assertSessionOwner(req, req.params.sessionId);

    const sanitized = sanitizeSessionPayload(req.body);
    const updated = await updatePitchDeckViewSession(req.params.sessionId, {
      pages_viewed: sanitized.pages_viewed,
      time_per_page_ms: sanitized.time_per_page_ms,
      last_page: sanitized.last_page,
      total_duration_ms: sanitized.total_duration_ms,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const completePitchDeckSession = async (req, res, next) => {
  try {
    const session = await assertSessionOwner(req, req.params.sessionId);
    const sanitized = sanitizeSessionPayload(req.body);

    const pagesViewed =
      sanitized.pages_viewed ??
      parseStoredJson(session.pages_viewed, []);

    const timePerPageMs =
      sanitized.time_per_page_ms ??
      parseStoredJson(session.time_per_page_ms, {});

    const startedAt = new Date(session.started_at).getTime();
    const computedDuration =
      sanitized.total_duration_ms ??
      Math.max(0, Date.now() - startedAt);

    const totalPages = sanitized.total_pages ?? session.total_pages;

    const deckCompleted = isDeckFullyViewed({
      pagesViewed,
      totalPages,
    });

    const updated = await updatePitchDeckViewSession(req.params.sessionId, {
      pages_viewed: pagesViewed,
      time_per_page_ms: timePerPageMs,
      total_duration_ms: computedDuration,
      completed: deckCompleted,
      ended_at: new Date().toISOString(),
      last_page: sanitized.last_page || session.last_page || 1,
      total_pages: sanitized.total_pages,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const analyzePitchDeck = async (req, res, next) => {
  try {
    const profile = await assertPitchDeckAccess(req, req.params.startupProfileId);
    const isOwner = String(profile.user_id) === String(req.user.id);

    if (!isOwner && req.user.user_type !== "investor") {
      return res.status(403).json({
        success: false,
        error:
          "Only the startup owner or investors can request pitch deck AI analysis",
      });
    }

    const { buffer } = await fetchDeckBuffer(profile.pitch_deck_url);
    const analysis = await generateGeminiPitchDeckAnalysis({
      companyName: profile.company_name,
      pdfBuffer: buffer,
    });

    const resolved =
      analysis || buildPitchDeckAnalysisFallback(profile.company_name);

    if (resolved.error) {
      return res.status(413).json({
        success: false,
        error: resolved.error,
      });
    }

    res.json({
      success: true,
      data: {
        startup_profile_id: profile.startup_profile_id,
        company_name: profile.company_name,
        ...resolved,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const pitchDeckErrorHandler = (error, req, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
  }
  next(error);
};
