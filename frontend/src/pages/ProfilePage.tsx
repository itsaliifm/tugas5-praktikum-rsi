// Halaman informasi pengguna yang sedang login.
// Data diambil langsung dari GET /auth/me (butuh token).
import { useCallback, useEffect, useState } from 'react';
import StatePanel from '../components/StatePanel';
import { roleLabels } from '../lib/permissions';
import { getMe } from '../services/api';
import type { User } from '../types/auth';

function ProfilePage() {
  const [me, setMe] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function loadMe(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getMe();
        if (!cancelled) setMe(data);
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error ? caughtError.message : 'Gagal memuat profil.',
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadMe();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (isLoading) {
    return <StatePanel variant="loading" message="Memuat data pengguna..." />;
  }

  if (error || !me) {
    return (
      <StatePanel
        variant="error"
        title="Profil gagal dimuat"
        message={error ?? undefined}
        actionLabel="Coba Lagi"
        onAction={reload}
      />
    );
  }

  return (
    <section className="form-card">
      <h1>Profil Saya</h1>

      <dl className="detail-grid">
        <div>
          <dt>Nama</dt>
          <dd>{me.name}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{me.email}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>
            <span className={`badge badge-role role-${me.role}`}>{roleLabels[me.role]}</span>
          </dd>
        </div>
      </dl>

    </section>
  );
}

export default ProfilePage;
