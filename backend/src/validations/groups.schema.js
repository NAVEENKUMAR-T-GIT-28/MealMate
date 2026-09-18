import { z } from 'zod';

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Group name must be at least 2 characters").max(100)
  })
});

export const joinGroupSchema = z.object({
  body: z.object({
    invite_code: z.string().length(6, "Invite code must be exactly 6 characters")
  })
});

export const groupParamsSchema = z.object({
  params: z.object({
    groupId: z.string().regex(/^\d+$/, "Group ID must be numeric")
  })
});

export const memberParamsSchema = z.object({
  params: z.object({
    groupId: z.string().regex(/^\d+$/, "Group ID must be numeric"),
    userId: z.string().regex(/^\d+$/, "User ID must be numeric")
  })
});
