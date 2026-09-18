import express from 'express';
import {
  createGroup,
  joinGroup,
  getMyGroups,
  getGroupMembers,
  updateMemberStatus,
  removeMember,
  admitMember,
  cancelJoinRequest
} from '../controllers/groups.controller.js';
import { requireAuth, requireGroupMember, requireGroupAdmin } from '../middleware/auth.js';

const router = express.Router();

// All group routes require authentication
router.use(requireAuth);

router.post('/', createGroup);
router.post('/join', joinGroup);
router.get('/', getMyGroups);
router.get('/:groupId/members', requireGroupMember, getGroupMembers);
router.delete('/:groupId/cancel-request', cancelJoinRequest);

// Admin only operations
router.put('/:groupId/members/:userId/status', requireGroupMember, requireGroupAdmin, updateMemberStatus);
router.delete('/:groupId/members/:userId', requireGroupMember, requireGroupAdmin, removeMember);
router.put('/:groupId/members/:userId/admit', requireGroupMember, requireGroupAdmin, admitMember);

export default router;
