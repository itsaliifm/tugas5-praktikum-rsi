import { z } from 'zod';

// POST /stalls/:id/reviews
export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

// POST /reviews: stallId di body, userId dari token.
export const createReviewLegacySchema = createReviewSchema.extend({
  stallId: z.coerce.number().int().positive(),
});

export const reviewIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
