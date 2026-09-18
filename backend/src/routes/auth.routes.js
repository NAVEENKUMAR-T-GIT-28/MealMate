import express from 'express';
import { signup, login, getMe, updateMe } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateMe);

export default router;
