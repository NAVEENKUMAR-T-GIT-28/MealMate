import express from 'express';
import { createGroup, joinGroup, getMyGroups, getGroupMembers } from '../controllers/groups.controller.js';
import { requireAuth, requireGroupMember } from '../middleware/auth.js';

const router = express.Router();

// All group routes require authentication
router.use(requireAuth);

router.post('/', createGroup);
router.post('/join', joinGroup);
router.get('/', getMyGroups);
router.get('/:groupId/members', requireGroupMember, getGroupMembers);

export default router;
