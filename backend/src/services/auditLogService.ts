import type { DbExecutor } from '../db/transaction.ts';
import type { AuditLogDto, AuditLogPageDto } from '../dtos/auditLogDto.ts';
import type { UserToken } from '../middlewares/authMiddleware.ts';
import { AuditLogRepository, type AuditEntry } from '../repositories/auditLogRepository.ts';
import type { RequestContext } from '../utils/requestContext.ts';
import type { AuditLogQuery } from '../validators/auditLogValidator.ts';

interface AuthAuditInput {
  action: 'LOGIN' | 'LOGOUT';
  user: Pick<UserToken, 'id' | 'role'>;
  context: RequestContext;
  result: 'success' | 'failed';
  reason?: string;
}

export class AuditLogService {
  constructor(private auditLogRepository: AuditLogRepository = new AuditLogRepository()) {}

  // Dipanggil di dalam transaksi mutasi.
  async record(entry: AuditEntry, executor?: DbExecutor): Promise<void> {
    await this.auditLogRepository.insert(entry, executor);
  }

  // Audit LOGIN/LOGOUT best-effort: gagal tulis audit tidak menggagalkan login.
  // Password dan token tidak disimpan.
  async recordAuth(input: AuthAuditInput): Promise<void> {
    try {
      await this.record({
        userId: input.user.id,
        action: input.action,
        targetTable: 'USERS',
        targetId: input.user.id,
        metadata: {
          role: input.user.role,
          ip_address: input.context.ipAddress,
          user_agent: input.context.userAgent,
          result: input.result,
          ...(input.reason ? { reason: input.reason } : {}),
        },
      });
    } catch (error) {
      console.error(`Audit ${input.action} gagal dicatat:`, error);
    }
  }

  async list(query: AuditLogQuery): Promise<AuditLogPageDto> {
    const { items, total } = await this.auditLogRepository.findPage(query);
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.pageSize);

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
      },
    };
  }

  async getById(id: number): Promise<AuditLogDto> {
    const log = await this.auditLogRepository.findById(id);
    if (!log) throw new Error('AUDIT_LOG_NOT_FOUND');
    return log;
  }
}
