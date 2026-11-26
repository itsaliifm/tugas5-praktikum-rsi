import type { Request, Response } from 'express';
import { AuditLogService } from '../services/auditLogService.ts';
import type { AuditLogQuery } from '../validators/auditLogValidator.ts';

export class AuditLogController {
  constructor(private auditLogService: AuditLogService = new AuditLogService()) {}

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'AUDIT_LOG_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Catatan audit tidak ditemukan' });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });
  }

  // GET /audit-logs  ->  { status, data: { items, pagination } }
  getLogs = async (req: Request, res: Response): Promise<Response> => {
    try {
      const query = res.locals.validated?.query as AuditLogQuery;
      const data = await this.auditLogService.list(query);
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  // GET /audit-logs/:id  ->  { status, data }
  getLogById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = res.locals.validated?.params as { id: number };
      const data = await this.auditLogService.getById(id);
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}
