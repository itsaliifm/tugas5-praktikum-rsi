// Dialog konfirmasi hapus warung
import { useEffect, useState } from 'react';
import type { Stall } from '../types/stall';

interface ConfirmDialogProps {
  stall: Stall;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function ConfirmDialog({ stall, onClose, onConfirm }: ConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tutup dialog dengan tombol Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !isDeleting) onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDeleting, onClose]);

  async function handleConfirm(): Promise<void> {
    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal menghapus warung.',
      );
      setIsDeleting(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) onClose();
      }}
    >
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">Hapus warung?</h2>
        <p>
          Warung <strong>{stall.name}</strong> akan dihapus permanen.
          Tindakan ini tidak dapat dibatalkan.
        </p>

        {error ? (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        ) : null}

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isDeleting}
            autoFocus
          >
            Batal
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => void handleConfirm()}
            disabled={isDeleting}
          >
            {isDeleting ? 'Menghapus...' : 'Ya, hapus'}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
