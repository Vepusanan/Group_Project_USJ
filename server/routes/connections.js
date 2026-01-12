import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
    requestConnection,
    acceptConnection,
    declineConnection,
    getConnections,
    getNotifications
} from "../controllers/connectionController.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", requestConnection);
router.put("/:id/accept", acceptConnection);
router.put("/:id/decline", declineConnection);
router.get("/", getConnections);
router.get("/notifications/:userId", getNotifications);

export default router;
