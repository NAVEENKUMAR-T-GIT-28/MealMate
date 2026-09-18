import express from 'express';
import { getMonthlySummary } from '../controllers/summary.controller.js';
import { requireAuth, requireGroupMember } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/:month', requireGroupMember, getMonthlySummary);

export default router;
