import { getDb } from './index.ts';

// Tipe instance Drizzle dan transaksi Drizzle.
export type Db = Awaited<ReturnType<typeof getDb>>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

// Parameter executor di repository: db biasa atau tx di dalam transaksi.
export type DbExecutor = Db | Tx;

// Menjalankan query dalam satu transaksi, rollback jika callback error.
export async function withTransaction<T>(work: (tx: Tx) => Promise<T>): Promise<T> {
  const db = await getDb();
  return db.transaction(work);
}
