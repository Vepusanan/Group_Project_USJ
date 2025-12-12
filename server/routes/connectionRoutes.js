import express from 'express';
import {
    getConnections,
    getPendingSentRequests,
    getPendingReceivedRequests,
    removeConnection
} from '../controllers/connectionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

router.get('/', getConnections);
router.get('/pending/sent', getPendingSentRequests);
router.get('/pending/received', getPendingReceivedRequests);
router.delete('/:id', removeConnection);

export default router;