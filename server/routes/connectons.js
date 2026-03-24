import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createConnection,
  listConnections,
  listPendingReceivedRequests,
  listPendingSentRequests,
  listPendingRequests,
  removeConnection,
  respondToConnection,
} from "../controllers/connectionController.js";

const router = express.Router();

router.use(protect);

router.get("/", listConnections);
router.post("/", createConnection);
router.get("/pending", listPendingRequests);
router.get("/pending/sent", listPendingSentRequests);
router.get("/pending/received", listPendingReceivedRequests);
router.patch("/:id", respondToConnection);
router.delete("/:id", removeConnection);

export default router;
