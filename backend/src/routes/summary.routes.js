import express from 'express';
import { getMonthlySummary } from '../controllers/summary.controller.js';
import { requireAuth, requireGroupMember } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getSummarySchema } from '../validations/summary.schema.js';

const router = express.Router();

router.use(requireAuth);

router.get('/:month', validate(getSummarySchema), requireGroupMember, getMonthlySummary);

export default router;
