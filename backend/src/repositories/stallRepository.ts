import { and, count, eq, like, sql, type SQL } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { stalls } from '../db/schema.ts';
import type { DbExecutor } from '../db/transaction.ts';

export interface FindAllParams {
  search?: string;
  category?: string;
  page: number;
  limit: number;
}

export interface CreateStallInput {
  ownerId: number;
  name: string;
  category?: string | null;
  location?: string | null;
  description?: string | null;
}

export class StallRepository {
  async findAll(params: FindAllParams) {
    const db = await getDb();

    const conditions: SQL[] = [];
    if (params.search) conditions.push(like(stalls.name, `%${params.search}%`));
    if (params.category) conditions.push(eq(stalls.category, params.category));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select()
      .from(stalls)
      .where(where)
      .orderBy(stalls.id)
      .offset(offset)
      .fetch(params.limit);

    const totals = await db.select({ total: count() }).from(stalls).where(where);

    return { rows, total: Number(totals[0]?.total ?? 0) };
  }

  async findById(id: number, executor?: DbExecutor) {
    const db = executor ?? (await getDb());
    const rows = await db.select().from(stalls).where(eq(stalls.id, id));
    return rows[0];
  }

  async create(input: CreateStallInput, executor?: DbExecutor) {
    const db = executor ?? (await getDb());
    const rows = await db
      .insert(stalls)
      .output()
      .values({
        ownerId: input.ownerId,
        name: input.name,
        category: input.category ?? null,
        location: input.location ?? null,
        description: input.description ?? null,
        avgRating: '0.00',
        reviewCount: 0,
      });
    return rows[0];
  }

  async update(id: number, input: Partial<CreateStallInput>, executor?: DbExecutor) {
    const db = executor ?? (await getDb());
    const rows = await db
      .update(stalls)
      .set({
        ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      })
      .where(eq(stalls.id, id))
      .output();
    return rows[0];
  }

  async remove(id: number, executor?: DbExecutor) {
    const db = executor ?? (await getDb());
    const rows = await db.delete(stalls).where(eq(stalls.id, id)).output();
    return rows[0];
  }

  // Hitung ulang rating rata-rata dan jumlah ulasan setelah review
  // ditambah atau dihapus (dipanggil di dalam transaksi yang sama).
  async refreshRating(stallId: number, executor?: DbExecutor) {
    const db = executor ?? (await getDb());
    await db
      .update(stalls)
      .set({
        reviewCount: sql`(SELECT COUNT(*) FROM dbo.REVIEWS WHERE stall_id = ${stallId})`,
        avgRating: sql`(SELECT ISNULL(CAST(AVG(CAST(rating AS DECIMAL(5,2))) AS DECIMAL(3,2)), 0) FROM dbo.REVIEWS WHERE stall_id = ${stallId})`,
      })
      .where(eq(stalls.id, stallId));
  }
}
