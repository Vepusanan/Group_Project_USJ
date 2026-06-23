import pool from "../config/database.js";
import {
  createConnectionNote,
  listConnectionNotes,
} from "../repositories/ConnectionNotesRepository.js";

const assertConnectionParticipant = async (connectionId, userId) => {
  const connResult = await pool.query(
    `SELECT * FROM public.connections WHERE id = $1`,
    [connectionId],
  );
  const connection = connResult.rows[0];
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

  return connection;
};

export const listMyConnectionNotes = async (req, res, next) => {
  try {
    await assertConnectionParticipant(req.params.connectionId, req.user.id);
    const notes = await listConnectionNotes(
      req.params.connectionId,
      req.user.id,
    );
    res.json({ success: true, data: notes });
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

export const addConnectionNote = async (req, res, next) => {
  try {
    await assertConnectionParticipant(req.params.connectionId, req.user.id);

    const content = String(req.body.content || "").trim();
    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Note content is required",
      });
    }
    if (content.length > 4000) {
      return res.status(400).json({
        success: false,
        error: "Note must be 4000 characters or fewer",
      });
    }

    const note = await createConnectionNote(
      req.params.connectionId,
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
