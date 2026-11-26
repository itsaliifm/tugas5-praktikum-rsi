import { z } from 'zod';

export const menuItemIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createMenuItemSchema = z.object({
  stallId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(100),
  price: z.coerce.number().int().min(0),
  isAvailable: z.boolean().optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();
