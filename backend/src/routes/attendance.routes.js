import express from 'express';
import { getAttendance, toggleAttendance } from '../controllers/attendance.controller.js';
import { requireAuth, requireGroupMember } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getAttendanceSchema, toggleAttendanceSchema } from '../validations/attendance.schema.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', validate(getAttendanceSchema), requireGroupMember, getAttendance);
router.put('/toggle', validate(toggleAttendanceSchema), requireGroupMember, toggleAttendance);

export default router;
