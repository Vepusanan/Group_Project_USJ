import pool from "../config/database.js";
import {
  answerQaThread,
  createQaQuestion,
  getQaThreadById,
  listQaThreads,
  QA_CATEGORIES,
} from "../repositories/ConnectionQaRepository.js";
import { getChecklistItemById } from "../repositories/DdChecklistRepository.js";

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
    const error = new Error("Q&A requires an accepted connection");
    error.statusCode = 400;
    throw error;
  }

  return connection;
};

export const listConnectionQa = async (req, res, next) => {
  try {
    await assertConnectionParticipant(req.params.connectionId, req.user.id);
    const threads = await listQaThreads(req.params.connectionId);
    res.json({ success: true, data: threads });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const askConnectionQuestion = async (req, res, next) => {
  try {
    if (req.user.user_type !== "investor") {
      return res
        .status(403)
        .json({ success: false, error: "Only investors can ask questions" });
    }

    await assertConnectionParticipant(req.params.connectionId, req.user.id);

    const category = String(req.body.category || "").toUpperCase();
    const question = String(req.body.question || "").trim();

    if (!QA_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, error: "Invalid category" });
    }

    if (!question) {
      return res
        .status(400)
        .json({ success: false, error: "Question is required" });
    }

    let checklistItemId = req.body.checklist_item_id || null;
    if (checklistItemId) {
      const item = await getChecklistItemById(checklistItemId);
      if (!item) {
        return res
          .status(404)
          .json({ success: false, error: "Checklist item not found" });
      }

      const checklistResult = await pool.query(
        `SELECT connection_id FROM public.dd_checklists WHERE id = $1`,
        [item.checklist_id],
      );
      const itemConnectionId = checklistResult.rows[0]?.connection_id;
      if (String(itemConnectionId) !== String(req.params.connectionId)) {
        return res
          .status(400)
          .json({ success: false, error: "Checklist item does not belong to this connection" });
      }
    }

    const thread = await createQaQuestion({
      connectionId: req.params.connectionId,
      askedBy: req.user.id,
      category,
      question,
      checklistItemId,
    });

    res.status(201).json({ success: true, data: thread });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const answerConnectionQuestion = async (req, res, next) => {
  try {
    if (req.user.user_type !== "startup") {
      return res
        .status(403)
        .json({ success: false, error: "Only startups can answer questions" });
    }

    const thread = await getQaThreadById(req.params.threadId);
    if (!thread) {
      return res.status(404).json({ success: false, error: "Question not found" });
    }

    await assertConnectionParticipant(thread.connection_id, req.user.id);

    const answer = String(req.body.answer || "").trim();
    if (!answer) {
      return res.status(400).json({ success: false, error: "Answer is required" });
    }

    const updated = await answerQaThread({
      threadId: req.params.threadId,
      answer,
    });

    if (!updated) {
      return res
        .status(400)
        .json({ success: false, error: "Question already answered" });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message });
    }
    next(error);
  }
};
