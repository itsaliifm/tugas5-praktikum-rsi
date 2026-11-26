// Panel loading, error, dan empty state
interface StatePanelProps {
  variant: 'loading' | 'error' | 'empty';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function StatePanel({
  variant,
  title,
  message,
  actionLabel,
  onAction,
}: StatePanelProps) {
  if (variant === 'loading') {
    return (
      <div className="state-panel" role="status" aria-busy="true">
        <span className="spinner" aria-hidden="true" />
        <p>{message ?? 'Memuat data...'}</p>
      </div>
    );
  }

  const isError = variant === 'error';

  return (
    <div className={`state-panel ${isError ? 'state-error' : 'state-empty'}`}>
      <div className="state-icon" aria-hidden="true">
        {isError ? '⚠️' : '🍽️'}
      </div>

      <h2>{title ?? (isError ? 'Gagal memuat data' : 'Belum ada data')}</h2>

      <p>
        {message ??
          (isError
            ? 'Periksa koneksi lalu coba lagi.'
            : 'Data akan muncul di sini setelah ditambahkan.')}
      </p>

      {onAction && actionLabel ? (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default StatePanel;
