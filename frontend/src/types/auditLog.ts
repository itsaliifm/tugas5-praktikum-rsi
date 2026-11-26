// Data dari GET /audit-logs dan GET /audit-logs/:id
export interface AuditLog {
  id: number;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  targetTable: string;
  targetId: number | null;
  metadata: unknown;
  createdAt: string;
}

export interface AuditLogPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AuditLogList {
  items: AuditLog[];
  pagination: AuditLogPagination;
}

export interface AuditLogFilters {
  page?: number;
  pageSize?: number;
  action?: string;
  targetTable?: string;
  targetId?: number;
  userId?: number;
  from?: string;
  to?: string;
}
