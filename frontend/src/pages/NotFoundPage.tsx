import { useNavigate } from 'react-router-dom';
import StatePanel from '../components/StatePanel';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <StatePanel
      variant="empty"
      title="404 · Halaman tidak ditemukan"
      message="Alamat yang kamu buka tidak tersedia."
      actionLabel="Kembali ke Daftar Warung"
      onAction={() => navigate('/')}
    />
  );
}

export default NotFoundPage;
