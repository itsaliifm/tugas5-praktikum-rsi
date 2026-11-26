// Notifikasi berhasil/gagal, tampil sampai ditutup
export interface ToastData {
  type: 'success' | 'error';
  message: string;
}

interface ToastProps {
  toast: ToastData;
  onClose: () => void;
}

function Toast({ toast, onClose }: ToastProps) {
  const isSuccess = toast.type === 'success';

  return (
    <div
      className={`notice ${isSuccess ? 'notice-success' : 'notice-error'}`}
      role={isSuccess ? 'status' : 'alert'}
    >
      <p>
        <strong>{isSuccess ? 'Berhasil' : 'Gagal'}:</strong> {toast.message}
      </p>
      <button type="button" onClick={onClose} aria-label="Tutup notifikasi">
        ✕
      </button>
    </div>
  );
}

export default Toast;
