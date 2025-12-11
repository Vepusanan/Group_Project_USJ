import express from 'express';
import { getStartups } from '../controllers/startupsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Protected routes (require login)
router.get('/', verifyToken, getStartups);

export default router;
