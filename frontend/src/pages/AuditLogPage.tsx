// Halaman riwayat audit (admin)
import { useEffect, useState, type FormEvent } from 'react';
import AuditDetailModal from '../components/AuditDetailModal';
import StatePanel from '../components/StatePanel';
import {
  actionClass,
  actionLabel,
  auditActionOptions,
  auditTargetOptions,
  describeMetadata,
  formatDateTime,
  targetLabel,
} from '../lib/audit';
import { getFieldErrors } from '../lib/validation';
import { ApiError, getAuditLogs } from '../services/api';
import type { AuditLog, AuditLogPagination } from '../types/auditLog';

const PAGE_SIZE = 20;

interface FilterDraft {
  action: string;
  targetTable: string;
  targetId: string;
  userId: string;
  from: string;
  to: string;
}

const emptyFilters: FilterDraft = {
  action: '',
  targetTable: '',
  targetId: '',
  userId: '',
  from: '',
  to: '',
};

const emptyPagination: AuditLogPagination = {
  page: 1,
  pageSize: PAGE_SIZE,
  total: 0,
  totalPages: 0,
};

function AuditLogPage() {
  const [draftFilters, setDraftFilters] = useState<FilterDraft>(emptyFilters);
  const [filters, setFilters] = useState<FilterDraft>(emptyFilters);
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<AuditLogPagination>(emptyPagination);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadLogs(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getAuditLogs({
          page,
          pageSize: PAGE_SIZE,
          action: filters.action || undefined,
          targetTable: filters.targetTable || undefined,
          targetId: filters.targetId ? Number(filters.targetId) : undefined,
          userId: filters.userId ? Number(filters.userId) : undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
        });

        if (!active) return;
        setLogs(data.items);
        setPagination(data.pagination);
      } catch (caughtError) {
        if (!active) return;

        // Error validasi 400 per field
        const fieldMessage =
          caughtError instanceof ApiError
            ? Object.values(getFieldErrors(caughtError.details))[0]
            : undefined;

        setError(
          fieldMessage ??
            (caughtError instanceof Error ? caughtError.message : 'Riwayat audit gagal dimuat.'),
        );
        setLogs([]);
        setPagination(emptyPagination);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadLogs();

    return () => {
      active = false;
    };
  }, [filters, page, reloadKey]);

  function updateDraft(field: keyof FilterDraft, value: string): void {
    setDraftFilters((current) => ({ ...current, [field]: value }));
  }

  function applyFilters(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setFilters({ ...draftFilters });
    setPage(1);
  }

  function resetFilters(): void {
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
    setReloadKey((current) => current + 1);
  }

  const hasFilters = Object.values(filters).some((value) => value !== '');

  return (
    <>
      <section className="page-header">
        <div>
          <h1>Audit Log</h1>
          <p className="page-subtitle">
            Riwayat aktivitas login, logout, dan perubahan data. Catatan audit tidak dapat diubah atau
            dihapus.
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setReloadKey((current) => current + 1)}
            disabled={isLoading}
          >
            {isLoading ? 'Memuat...' : 'Muat Ulang'}
          </button>
        </div>
      </section>

      <form className="audit-filters" onSubmit={applyFilters}>
        <label>
          Aksi
          <select value={draftFilters.action} onChange={(event) => updateDraft('action', event.target.value)}>
            <option value="">Semua aksi</option>
            {auditActionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Target
          <select
            value={draftFilters.targetTable}
            onChange={(event) => updateDraft('targetTable', event.target.value)}
          >
            <option value="">Semua target</option>
            {auditTargetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Target ID
          <input
            type="number"
            min={1}
            placeholder="Masukkan target ID"
            value={draftFilters.targetId}
            onChange={(event) => updateDraft('targetId', event.target.value)}
          />
        </label>

        <label>
          User ID
          <input
            type="number"
            min={1}
            placeholder="Masukkan user ID"
            value={draftFilters.userId}
            onChange={(event) => updateDraft('userId', event.target.value)}
          />
        </label>

        <label>
          Dari tanggal
          <input type="date" value={draftFilters.from} onChange={(event) => updateDraft('from', event.target.value)} />
        </label>

        <label>
          Sampai tanggal
          <input type="date" value={draftFilters.to} onChange={(event) => updateDraft('to', event.target.value)} />
        </label>

        <div className="audit-filter-actions">
          <button type="submit" className="btn btn-primary">
            Terapkan
          </button>
          <button type="button" className="btn btn-ghost" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </form>

      {isLoading ? (
        <StatePanel variant="loading" message="Memuat riwayat audit..." />
      ) : error ? (
        <StatePanel
          variant="error"
          title="Riwayat audit gagal dimuat"
          message={error}
          actionLabel="Coba Lagi"
          onAction={() => setReloadKey((current) => current + 1)}
        />
      ) : logs.length === 0 ? (
        <StatePanel
          variant="empty"
          title={hasFilters ? 'Tidak ada catatan yang cocok' : 'Belum ada aktivitas'}
          message={
            hasFilters
              ? 'Coba ubah atau reset filter.'
              : 'Catatan akan muncul setelah ada login atau perubahan data.'
          }
          actionLabel={hasFilters ? 'Reset Filter' : undefined}
          onAction={hasFilters ? resetFilters : undefined}
        />
      ) : (
        <>
          <div className="table-box">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Waktu</th>
                  <th>Aksi</th>
                  <th>Target</th>
                  <th>Pengguna</th>
                  <th>Ringkasan</th>
                  <th aria-label="Detail"></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="cell-muted">#{log.id}</td>
                    <td className="cell-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td>
                      <span className={`badge ${actionClass(log.action)}`}>{actionLabel(log.action)}</span>
                    </td>
                    <td>
                      {targetLabel(log.targetTable)}
                      {log.targetId !== null ? <span className="cell-muted"> #{log.targetId}</span> : null}
                    </td>
                    <td>
                      <strong>{log.userName ?? '-'}</strong>
                      <span className="cell-sub">
                        ID {log.userId ?? '-'}
                        {log.userEmail ? ` · ${log.userEmail}` : ''}
                      </span>
                    </td>
                    <td className="cell-muted">{describeMetadata(log.metadata)}</td>
                    <td className="cell-right">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedId(log.id)}>
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className="pagination" aria-label="Pagination audit">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setPage((current) => current - 1)}
              disabled={page <= 1}
            >
              ← Sebelumnya
            </button>
            <span>
              Halaman {pagination.page} dari {pagination.totalPages} · {pagination.total} catatan
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setPage((current) => current + 1)}
              disabled={page >= pagination.totalPages}
            >
              Berikutnya →
            </button>
          </nav>
        </>
      )}

      {selectedId !== null ? (
        <AuditDetailModal logId={selectedId} onClose={() => setSelectedId(null)} />
      ) : null}
    </>
  );
}

export default AuditLogPage;
