import express from 'express';
import { getAttendance, toggleAttendance } from '../controllers/attendance.controller.js';
import { requireAuth, requireGroupMember } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', requireGroupMember, getAttendance);
router.put('/toggle', requireGroupMember, toggleAttendance);

export default router;
