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
import { validate } from '../middleware/validate.js';
import { createGroupSchema, joinGroupSchema, groupParamsSchema, memberParamsSchema } from '../validations/groups.schema.js';

const router = express.Router();

// All group routes require authentication
router.use(requireAuth);

router.post('/', validate(createGroupSchema), createGroup);
router.post('/join', validate(joinGroupSchema), joinGroup);
router.get('/', getMyGroups);
router.get('/:groupId/members', validate(groupParamsSchema), requireGroupMember, getGroupMembers);
router.delete('/:groupId/cancel-request', validate(groupParamsSchema), cancelJoinRequest);

// Admin only operations
router.put('/:groupId/members/:userId/status', validate(memberParamsSchema), requireGroupMember, requireGroupAdmin, updateMemberStatus);
router.delete('/:groupId/members/:userId', validate(memberParamsSchema), requireGroupMember, requireGroupAdmin, removeMember);
router.put('/:groupId/members/:userId/admit', validate(memberParamsSchema), requireGroupMember, requireGroupAdmin, admitMember);

export default router;
