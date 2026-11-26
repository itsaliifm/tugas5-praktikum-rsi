// Halaman detail warung (publik), data dari GET /stalls/:id.
// Tombol Edit / Hapus hanya muncul sesuai role, tetapi backend tetap
// memeriksa ulang (401 / 403).
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import StatePanel from '../components/StatePanel';
import { useAuth } from '../context/AuthContext';
import { canDeleteStall, canEditStall } from '../lib/permissions';
import { ApiError, deleteStall, getStallById } from '../services/api';
import type { Stall } from '../types/stall';

function StallDetailPage() {
  const { id } = useParams();
  const stallId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stall, setStall] = useState<Stall | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function loadStall(): Promise<void> {
      setIsLoading(true);
      setError(null);
      setIsNotFound(false);

      try {
        const data = await getStallById(stallId);
        if (!cancelled) setStall(data);
      } catch (caughtError) {
        if (cancelled) return;

        // 404 dari backend (atau 400 karena ID tidak valid) = data tidak ditemukan
        if (
          caughtError instanceof ApiError &&
          (caughtError.status === 404 || caughtError.status === 400)
        ) {
          setIsNotFound(true);
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Gagal memuat detail warung.',
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadStall();

    return () => {
      cancelled = true;
    };
  }, [stallId, reloadKey]);

  async function handleDelete(): Promise<void> {
    if (!stall) return;

    await deleteStall(stall.id);

    navigate('/', {
      state: {
        toast: { type: 'success', message: `Warung "${stall.name}" berhasil dihapus.` },
      },
    });
  }

  if (isLoading) {
    return <StatePanel variant="loading" message="Memuat detail warung..." />;
  }

  if (error || !stall) {
    return (
      <StatePanel
        variant={isNotFound ? 'empty' : 'error'}
        title={isNotFound ? 'Warung tidak ditemukan' : 'Detail warung gagal dimuat'}
        message={error ?? undefined}
        actionLabel={isNotFound ? 'Kembali ke Daftar' : 'Coba Lagi'}
        onAction={isNotFound ? () => navigate('/') : reload}
      />
    );
  }

  const canEdit = canEditStall(user, stall);
  const canDelete = canDeleteStall(user);
  const isMine = user?.role === 'owner' && stall.ownerId === user.id;

  return (
    <>
      <Link to="/" className="back-link">
        ← Kembali ke daftar warung
      </Link>

      <article className="detail-card">
        <div className="detail-header">
          <div>
            <div className="stall-badges">
              <span className="badge badge-category">{stall.category || 'Lainnya'}</span>
              {isMine ? <span className="badge badge-mine">Milik saya</span> : null}
              {stall.isPopular ? <span className="badge badge-popular">Populer</span> : null}
            </div>
            <h1>{stall.name}</h1>
          </div>

          {canEdit || canDelete ? (
            <div className="page-actions">
              {canEdit ? (
                <Link to={`/stalls/${stall.id}/edit`} className="btn btn-primary">
                  Edit Warung
                </Link>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  Hapus
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className="detail-description">
          {stall.description || 'Tidak ada deskripsi.'}
        </p>

        <dl className="detail-grid">
          <div>
            <dt>Lokasi</dt>
            <dd>{stall.location || '-'}</dd>
          </div>
          <div>
            <dt>Rating</dt>
            <dd>⭐ {stall.avgRating.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Jumlah Ulasan</dt>
            <dd>{stall.reviewCount}</dd>
          </div>
        </dl>

      </article>

      {isDeleteOpen ? (
        <ConfirmDialog
          stall={stall}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </>
  );
}

export default StallDetailPage;
