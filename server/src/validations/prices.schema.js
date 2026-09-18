import { z } from 'zod';

export const setPriceSchema = z.object({
  body: z.object({
    group_id: z.number().int().positive("Group ID must be a positive integer"),
    meal_type: z.enum(['morning', 'afternoon', 'night']),
    price: z.number().min(0, "Price cannot be negative"),
    effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
  })
});

export const getPricesSchema = z.object({
  query: z.object({
    group_id: z.string().regex(/^\d+$/, "Group ID must be numeric")
  })
});
