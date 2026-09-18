import express from 'express';
import { getPrices, addPrice } from '../controllers/prices.controller.js';
import { requireAuth, requireGroupMember, requireGroupAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', requireGroupMember, getPrices);
router.post('/', requireGroupMember, requireGroupAdmin, addPrice);

export default router;
