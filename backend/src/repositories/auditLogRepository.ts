import { and, count, desc, eq, gte, lt, type SQL } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { auditLogs, users } from '../db/schema.ts';
import type { DbExecutor } from '../db/transaction.ts';
import type { AuditLogDto } from '../dtos/auditLogDto.ts';
import type { AuditLogQuery } from '../validators/auditLogValidator.ts';

export interface AuditEntry {
  userId: number;
  action: string;
  targetTable: string;
  targetId: number;
  metadata?: unknown;
}

// userName dan userEmail diambil dari USERS (LEFT JOIN).
const auditColumns = {
  id: auditLogs.id,
  userId: auditLogs.userId,
  userName: users.name,
  userEmail: users.email,
  action: auditLogs.action,
  targetTable: auditLogs.targetTable,
  targetId: auditLogs.targetId,
  metadata: auditLogs.metadata,
  createdAt: auditLogs.createdAt,
};

type AuditRow = {
  id: number;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  targetTable: string;
  targetId: number | null;
  metadata: string | null;
  createdAt: Date | string | null;
};

function parseMetadata(value: string | null): unknown {
  if (value === null) return null;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function toIso(value: Date | string | null): string {
  if (value === null) return '';
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDto(row: AuditRow): AuditLogDto {
  return {
    id: row.id,
    userId: row.userId === null ? null : Number(row.userId),
    userName: row.userName,
    userEmail: row.userEmail,
    action: row.action,
    targetTable: row.targetTable,
    targetId: row.targetId === null ? null : Number(row.targetId),
    metadata: parseMetadata(row.metadata),
    createdAt: toIso(row.createdAt),
  };
}

// Rentang [from 00:00, to+1 hari 00:00) agar tanggal "to" ikut terhitung.
function startOfDay(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function endOfDayExclusive(value: string): Date {
  const date = startOfDay(value);
  date.setDate(date.getDate() + 1);
  return date;
}

// Filter digabung dengan AND (parameterized query).
function buildWhere(query: AuditLogQuery): SQL | undefined {
  const conditions: SQL[] = [];

  if (query.action) conditions.push(eq(auditLogs.action, query.action));
  if (query.targetTable) conditions.push(eq(auditLogs.targetTable, query.targetTable));
  if (query.targetId) conditions.push(eq(auditLogs.targetId, query.targetId));
  if (query.userId) conditions.push(eq(auditLogs.userId, query.userId));
  if (query.from) conditions.push(gte(auditLogs.createdAt, startOfDay(query.from)));
  if (query.to) conditions.push(lt(auditLogs.createdAt, endOfDayExclusive(query.to)));

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export class AuditLogRepository {
  // executor = tx jika ikut transaksi mutasi, default db untuk LOGIN/LOGOUT.
  async insert(entry: AuditEntry, executor?: DbExecutor): Promise<void> {
    const db = executor ?? (await getDb());
    const metadata = entry.metadata === undefined ? null : JSON.stringify(entry.metadata);

    await db.insert(auditLogs).values({
      userId: entry.userId,
      action: entry.action,
      targetTable: entry.targetTable,
      targetId: entry.targetId,
      metadata,
    });
  }

  // Pagination di database (OFFSET ... FETCH).
  async findPage(query: AuditLogQuery): Promise<{ items: AuditLogDto[]; total: number }> {
    const db = await getDb();
    const where = buildWhere(query);

    const rows = await db
      .select(auditColumns)
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.userId))
      .where(where)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .offset((query.page - 1) * query.pageSize)
      .fetch(query.pageSize);

    // Total sesuai filter.
    const totals = await db.select({ total: count() }).from(auditLogs).where(where);

    return {
      items: rows.map((row) => toDto(row as AuditRow)),
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async findById(id: number): Promise<AuditLogDto | undefined> {
    const db = await getDb();
    const rows = await db
      .select(auditColumns)
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.userId))
      .where(eq(auditLogs.id, id));

    return rows[0] ? toDto(rows[0] as AuditRow) : undefined;
  }
}
