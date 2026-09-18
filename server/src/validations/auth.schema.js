import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    full_name: z.string().min(2, "Full name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email format").max(255),
    password: z.string().min(6, "Password must be at least 6 characters").max(128)
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required")
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().min(2, "Full name must be at least 2 characters").max(100)
  })
});
