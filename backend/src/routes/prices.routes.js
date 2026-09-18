import express from 'express';
import { getPrices, addPrice } from '../controllers/prices.controller.js';
import { requireAuth, requireGroupMember, requireGroupAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getPricesSchema, setPriceSchema } from '../validations/prices.schema.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', validate(getPricesSchema), requireGroupMember, getPrices);
router.post('/', validate(setPriceSchema), requireGroupMember, requireGroupAdmin, addPrice);

export default router;
