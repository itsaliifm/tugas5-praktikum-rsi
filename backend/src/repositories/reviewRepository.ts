import { and, eq } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { reviews, users } from '../db/schema.ts';
import type { DbExecutor } from '../db/transaction.ts';

export interface CreateReviewInput {
  stallId: number;
  userId: number;
  rating: number;
  comment?: string | null;
}

export class ReviewRepository {
  // JOIN user
  async findAllWithUser(stallId?: number) {
    const db = await getDb();
    const query = db
      .select({
        id: reviews.id,
        stallId: reviews.stallId,
        userId: reviews.userId,
        rating: reviews.rating,
        comment: reviews.comment,
        likeCount: reviews.likeCount,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        userName: users.name,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id));

    return stallId ? query.where(eq(reviews.stallId, stallId)) : query;
  }

  async create(input: CreateReviewInput, executor?: DbExecutor) {
    const db = executor ?? (await getDb());
    const rows = await db
      .insert(reviews)
      .output()
      .values({
        stallId: input.stallId,
        userId: input.userId,
        rating: input.rating,
        comment: input.comment ?? null,
        likeCount: 0,
      });
    return rows[0];
  }

  async remove(id: number, executor?: DbExecutor) {
    const db = executor ?? (await getDb());
    const rows = await db.delete(reviews).where(eq(reviews.id, id)).output();
    return rows[0];
  }

  async findById(id: number, executor?: DbExecutor) {
    const db = executor ?? (await getDb());
    const rows = await db.select().from(reviews).where(eq(reviews.id, id));
    return rows[0];
  }

  // Satu user hanya boleh punya satu review per warung (UQ_REVIEWS_user_stall)
  async findByUserAndStall(userId: number, stallId: number, executor?: DbExecutor) {
    const db = executor ?? (await getDb());
    const rows = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.stallId, stallId)));
    return rows[0];
  }
}
