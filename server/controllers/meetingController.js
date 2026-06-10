import pool from "../config/database.js";
import {
  createMeetingNote,
  createMeetingRequest,
  getMeetingById,
  listMeetingNotesForUser,
  listMeetingsForConnection,
  respondToMeeting,
  saveMeetingBrief,
  MEETING_FORMATS,
} from "../repositories/MeetingRepository.js";
import { listConnectionNotes } from "../repositories/ConnectionNotesRepository.js";
import { listQaThreads } from "../repositories/ConnectionQaRepository.js";
import { getStartupProfileByUserId } from "../repositories/StartupProfileRepository.js";
import { listPitchDeckSessionsForStartup } from "../repositories/PitchDeckViewSessionRepository.js";
import { generateGeminiMeetingBrief } from "../utils/geminiService.js";
import {
  getFrontendBaseUrl,
  sendMeetingConfirmationEmail,
  sendMeetingRequestEmail,
} from "../utils/emailServices.js";
import { buildMeetingIcs } from "../utils/meetingCalendar.js";

const getConnectionById = async (connectionId) => {
  const result = await pool.query(
    `SELECT * FROM public.connections WHERE id = $1`,
    [connectionId],
  );
  return result.rows[0] || null;
};

const assertConnectionParticipant = async (connectionId, userId) => {
  const connection = await getConnectionById(connectionId);
  if (!connection) {
    const error = new Error("Connection not found");
    error.statusCode = 404;
    throw error;
  }

  const isParticipant =
    String(connection.investor_id) === String(userId) ||
    String(connection.startup_id) === String(userId);

  if (!isParticipant) {
    const error = new Error("Not authorized for this connection");
    error.statusCode = 403;
    throw error;
  }

  const normalized = String(connection.status || "").toLowerCase();
  if (!["accepted", "connected"].includes(normalized)) {
    const error = new Error("Meetings require an accepted connection");
    error.statusCode = 400;
    throw error;
  }

  return connection;
};

export const listConnectionMeetings = async (req, res, next) => {
  try {
    await assertConnectionParticipant(req.params.connectionId, req.user.id);
    const meetings = await listMeetingsForConnection(req.params.connectionId);

    const withNotes = await Promise.all(
      meetings.map(async (meeting) => ({
        ...meeting,
        notes: await listMeetingNotesForUser(meeting.id, req.user.id),
        can_add_notes:
          meeting.status === "accepted" &&
          new Date(meeting.proposed_at).getTime() < Date.now(),
        ai_brief: meeting.ai_brief || null,
        ai_brief_generated_at: meeting.ai_brief_generated_at || null,
      })),
    );

    res.json({ success: true, data: withNotes });
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

export const createMeetingRequestHandler = async (req, res, next) => {
  try {
    if (req.user.user_type !== "investor") {
      return res.status(403).json({
        success: false,
        error: "Only investors can request meetings",
      });
    }

    const connection = await assertConnectionParticipant(
      req.params.connectionId,
      req.user.id,
    );

    if (String(connection.investor_id) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: "Only the investor in this connection can request a meeting",
      });
    }

    const format = String(req.body.format || "").toUpperCase();
    const agenda = String(req.body.agenda || "").trim();
    const message = String(req.body.message || "").trim() || null;
    const proposedAt = req.body.proposed_at;

    if (!MEETING_FORMATS.includes(format)) {
      return res.status(400).json({ success: false, error: "Invalid meeting format" });
    }
    if (!agenda) {
      return res.status(400).json({ success: false, error: "Agenda is required" });
    }
    if (!proposedAt || Number.isNaN(new Date(proposedAt).getTime())) {
      return res.status(400).json({ success: false, error: "Valid proposed date/time is required" });
    }
    if (new Date(proposedAt).getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        error: "Proposed meeting time must be in the future",
      });
    }

    const meeting = await createMeetingRequest({
      connectionId: req.params.connectionId,
      requestedBy: req.user.id,
      proposedAt,
      format,
      agenda,
      message,
    });

    const startupUser = await pool.query(
      `SELECT email, full_name FROM public.users WHERE id = $1`,
      [connection.startup_id],
    );
    const startup = startupUser.rows[0];

    if (startup?.email) {
      sendMeetingRequestEmail({
        email: startup.email,
        fullName: startup.full_name,
        requesterName: req.user.full_name || "An investor",
        proposedAt,
        format,
        agenda,
        message,
        connectionsUrl: `${getFrontendBaseUrl()}/connections`,
      }).catch(() => undefined);
    }

    res.status(201).json({ success: true, data: meeting });
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

export const respondToMeetingRequest = async (req, res, next) => {
  try {
    const meeting = await getMeetingById(req.params.meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, error: "Meeting not found" });
    }

    const connection = await assertConnectionParticipant(
      meeting.connection_id,
      req.user.id,
    );

    if (req.user.user_type !== "startup") {
      return res.status(403).json({
        success: false,
        error: "Only startups can accept or decline meeting requests",
      });
    }

    const decision = String(req.body.status || "").toLowerCase();
    if (!["accepted", "declined"].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: "Status must be accepted or declined",
      });
    }

    const updated = await respondToMeeting(req.params.meetingId, decision);
    if (!updated) {
      return res.status(400).json({
        success: false,
        error: "Meeting request is no longer pending",
      });
    }

    const users = await pool.query(
      `
        SELECT id, email, full_name FROM public.users
        WHERE id = ANY($1::uuid[])
      `,
      [[connection.investor_id, connection.startup_id]],
    );

    const connectionsUrl = `${getFrontendBaseUrl()}/connections`;

    for (const user of users.rows) {
      if (!user.email) continue;
      sendMeetingConfirmationEmail({
        email: user.email,
        fullName: user.full_name,
        proposedAt: updated.proposed_at,
        format: updated.format,
        agenda: updated.agenda,
        message: updated.message,
        accepted: decision === "accepted",
        connectionsUrl,
      }).catch(() => undefined);
    }

    res.json({ success: true, data: updated });
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

export const addMeetingNoteHandler = async (req, res, next) => {
  try {
    const meeting = await getMeetingById(req.params.meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, error: "Meeting not found" });
    }

    await assertConnectionParticipant(meeting.connection_id, req.user.id);

    if (meeting.status !== "accepted") {
      return res.status(400).json({
        success: false,
        error: "Notes can only be added to accepted meetings",
      });
    }

    if (new Date(meeting.proposed_at).getTime() >= Date.now()) {
      return res.status(400).json({
        success: false,
        error: "Post-meeting notes are available after the scheduled meeting time",
      });
    }

    const content = String(req.body.content || "").trim();
    if (!content || content.length > 4000) {
      return res.status(400).json({
        success: false,
        error: "Note must be 1–4000 characters",
      });
    }

    const note = await createMeetingNote(
      req.params.meetingId,
      req.user.id,
      content,
    );

    res.status(201).json({ success: true, data: note });
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

export const downloadMeetingCalendar = async (req, res, next) => {
  try {
    const meeting = await getMeetingById(req.params.meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, error: "Meeting not found" });
    }

    if (meeting.status !== "accepted") {
      return res.status(400).json({
        success: false,
        error: "Calendar file is only available for accepted meetings",
      });
    }

    const connection = await assertConnectionParticipant(
      meeting.connection_id,
      req.user.id,
    );

    const users = await pool.query(
      `
        SELECT id, full_name FROM public.users
        WHERE id = ANY($1::uuid[])
      `,
      [[connection.investor_id, connection.startup_id]],
    );

    const investor = users.rows.find(
      (row) => String(row.id) === String(connection.investor_id),
    );
    const startup = users.rows.find(
      (row) => String(row.id) === String(connection.startup_id),
    );

    const ics = buildMeetingIcs({
      meeting,
      organizerName: investor?.full_name,
      attendeeName: startup?.full_name,
      connectionsUrl: `${getFrontendBaseUrl()}/connections`,
    });

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="meeting-${meeting.id}.ics"`,
    );
    res.send(ics);
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

export const generateMeetingBriefHandler = async (req, res, next) => {
  try {
    if (req.user.user_type !== "investor") {
      return res.status(403).json({
        success: false,
        error: "Only investors can generate meeting briefs",
      });
    }

    const meeting = await getMeetingById(req.params.meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, error: "Meeting not found" });
    }

    if (meeting.status !== "accepted") {
      return res.status(400).json({
        success: false,
        error: "Meeting briefs are available for accepted meetings only",
      });
    }

    const connection = await assertConnectionParticipant(
      meeting.connection_id,
      req.user.id,
    );

    if (String(connection.investor_id) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: "Only the investor in this connection can generate a brief",
      });
    }

    if (meeting.ai_brief) {
      return res.json({
        success: true,
        data: {
          brief: meeting.ai_brief,
          generated_at: meeting.ai_brief_generated_at,
          cached: true,
        },
      });
    }

    const startupProfile = await getStartupProfileByUserId(connection.startup_id);
    const [notes, qaThreads, pitchSessions] = await Promise.all([
      listConnectionNotes(meeting.connection_id, req.user.id),
      listQaThreads(meeting.connection_id),
      startupProfile
        ? listPitchDeckSessionsForStartup(startupProfile.startup_profile_id)
        : Promise.resolve([]),
    ]);

    const investorSessions = pitchSessions.filter(
      (session) => String(session.investor_user_id) === String(req.user.id),
    );
    const latestSession = investorSessions[0] || null;

    const brief = await generateGeminiMeetingBrief({
      startup_name: startupProfile?.company_name,
      meeting_at: meeting.proposed_at,
      meeting_format: meeting.format,
      agenda: meeting.agenda,
      startup_profile: startupProfile
        ? {
            company_name: startupProfile.company_name,
            industry: startupProfile.industry,
            tagline: startupProfile.tagline,
            funding_stage: startupProfile.funding_stage,
            amount_seeking: startupProfile.amount_seeking,
            revenue_status: startupProfile.revenue_status,
            location_city: startupProfile.location_city,
            location_country: startupProfile.location_country,
            current_stage: startupProfile.current_stage,
          }
        : {},
      connection_notes: notes.slice(0, 8).map((n) => n.content),
      pitch_deck_engagement: latestSession
        ? {
            completed: latestSession.completed,
            pages_viewed: latestSession.pages_viewed,
            total_duration_ms: latestSession.total_duration_ms,
            last_viewed_at: latestSession.started_at,
          }
        : null,
      qa_threads: qaThreads.slice(0, 10).map((thread) => ({
        category: thread.category,
        question: thread.question,
        answer: thread.answer,
      })),
    });

    const { buildMeetingBriefFallback } = await import("../utils/aiFallbacks.js");
    const resolved =
      brief ||
      buildMeetingBriefFallback({
        startup_name: startupProfile?.company_name,
        meeting_at: meeting.proposed_at,
      });

    const saved = await saveMeetingBrief(meeting.id, resolved);

    res.json({
      success: true,
      data: {
        brief: resolved,
        generated_at: saved?.ai_brief_generated_at || new Date().toISOString(),
        cached: false,
      },
    });
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
