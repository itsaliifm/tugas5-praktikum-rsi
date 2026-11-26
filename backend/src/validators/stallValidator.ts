import { z } from 'zod';

export const stallQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const stallIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createStallSchema = z.object({
  name: z.string().trim().min(3).max(100),
  category: z.string().trim().max(50).optional(),
  location: z.string().trim().max(100).optional(),
  description: z.string().trim().max(1000).optional(),
});

export const updateStallSchema = createStallSchema.partial();