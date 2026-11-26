// Modal detail audit. Selalu memanggil GET /audit-logs/:id (bukan memakai
// data dari tabel), lalu menampilkan metadata, ip_address, dan user_agent.
import { useEffect, useState } from 'react';
import {
  actionClass,
  actionLabel,
  formatDateTime,
  formatMetadata,
  metadataText,
  targetLabel,
} from '../lib/audit';
import { getAuditLogById } from '../services/api';
import type { AuditLog } from '../types/auditLog';

interface AuditDetailModalProps {
  logId: number;
  onClose: () => void;
}

function AuditDetailModal({ logId, onClose }: AuditDetailModalProps) {
  const [log, setLog] = useState<AuditLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDetail(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getAuditLogById(logId);
        if (active) setLog(data);
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : 'Detail audit gagal dimuat.');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [logId]);

  // Tutup modal dengan tombol Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal modal-lg" role="dialog" aria-modal="true" aria-labelledby="audit-title">
        <div className="modal-header">
          <h2 id="audit-title">Detail Audit #{logId}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Tutup
          </button>
        </div>

        {isLoading ? (
          <div className="modal-state">
            <span className="spinner" aria-hidden="true" />
            <p>Memuat detail audit...</p>
          </div>
        ) : error || !log ? (
          <div className="alert alert-error" role="alert">
            {error ?? 'Detail audit tidak ditemukan.'}
          </div>
        ) : (
          <>
            <dl className="audit-detail">
              <div>
                <dt>Waktu</dt>
                <dd>{formatDateTime(log.createdAt)}</dd>
              </div>
              <div>
                <dt>Aksi</dt>
                <dd>
                  <span className={`badge ${actionClass(log.action)}`}>{actionLabel(log.action)}</span>{' '}
                  <code>{log.action}</code>
                </dd>
              </div>
              <div>
                <dt>Target</dt>
                <dd>
                  {targetLabel(log.targetTable)} <code>{log.targetTable}</code>
                  {log.targetId !== null ? ` #${log.targetId}` : ''}
                </dd>
              </div>
              <div>
                <dt>Pengguna</dt>
                <dd>
                  {log.userName ?? '-'} {log.userEmail ? `(${log.userEmail})` : ''}
                  {log.userId !== null ? ` · ID ${log.userId}` : ''}
                </dd>
              </div>
              <div>
                <dt>IP address</dt>
                <dd>
                  <code>{metadataText(log.metadata, 'ip_address') ?? '-'}</code>
                </dd>
              </div>
              <div>
                <dt>User agent</dt>
                <dd className="audit-agent">{metadataText(log.metadata, 'user_agent') ?? '-'}</dd>
              </div>
              {metadataText(log.metadata, 'result') ? (
                <div>
                  <dt>Hasil</dt>
                  <dd>{metadataText(log.metadata, 'result')}</dd>
                </div>
              ) : null}
            </dl>

            <h3 className="audit-meta-title">Metadata</h3>
            <pre className="audit-json">{formatMetadata(log.metadata)}</pre>
          </>
        )}
      </section>
    </div>
  );
}

export default AuditDetailModal;
