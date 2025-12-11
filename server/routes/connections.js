import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { sendRequest, updateStatus, getConnections } from '../controllers/connectionsController.js';

const router = express.Router();

router.use(verifyToken);

router.post('/request', sendRequest);
router.put('/status', updateStatus);
router.get('/', getConnections);

export default router;
