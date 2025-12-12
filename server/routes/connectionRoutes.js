import express from 'express';
import { sendConnectionRequest, getConnectionStatus } from '../controllers/connectionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/request', authenticateToken, sendConnectionRequest);
router.get('/status/:userId', authenticateToken, getConnectionStatus);

export default router;
