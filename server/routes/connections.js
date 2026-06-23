import express from "express";
import { protect } from "../middleware/auth.js";
import { connectionRequestLimiter } from "../middleware/rateLimiter.js";
import {
  createConnection,
  listConnections,
  listPendingReceivedRequests,
  listPendingSentRequests,
  listPendingRequests,
  removeConnection,
  respondToConnection,
} from "../controllers/connectionController.js";
import {
  addConnectionNote,
  listMyConnectionNotes,
} from "../controllers/connectionNotesController.js";

const router = express.Router();

router.use(protect);

router.get("/", listConnections);
router.post("/", connectionRequestLimiter, createConnection);
router.get("/pending", listPendingRequests);
router.get("/pending/sent", listPendingSentRequests);
router.get("/pending/received", listPendingReceivedRequests);
router.get("/:connectionId/notes", listMyConnectionNotes);
router.post("/:connectionId/notes", addConnectionNote);
router.patch("/:id", respondToConnection);
router.delete("/:id", removeConnection);

export default router;
