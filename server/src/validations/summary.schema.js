import { z } from 'zod';

export const getSummarySchema = z.object({
  query: z.object({
    group_id: z.string().regex(/^\d+$/, "Group ID must be numeric")
  }),
  params: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM format")
  })
});
