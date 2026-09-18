import { z } from 'zod';

export const getAttendanceSchema = z.object({
  query: z.object({
    group_id: z.string().regex(/^\d+$/, "Group ID must be numeric"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
    month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM").optional(),
    member_id: z.string().regex(/^\d+$/, "Member ID must be numeric").optional()
  }).refine(data => data.date || data.month, {
    message: "Either date or month is required",
    path: ["date", "month"]
  })
});

export const toggleAttendanceSchema = z.object({
  body: z.object({
    group_id: z.number().int().positive("Group ID must be a positive integer"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    meal_type: z.enum(['morning', 'afternoon', 'night'])
  })
});
