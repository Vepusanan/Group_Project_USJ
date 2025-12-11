import express from 'express';
import { getInvestors } from '../controllers/investorController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getInvestors);

export default router;
