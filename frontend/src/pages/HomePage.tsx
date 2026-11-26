// Halaman daftar warung (publik).
// Data diambil dari GET /stalls dengan query search, category, page, limit.
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import StallCard from '../components/StallCard';
import StatePanel from '../components/StatePanel';
import { useAuth } from '../context/AuthContext';
import { useStalls } from '../hooks/useStalls';
import { canCreateStall } from '../lib/permissions';

const PAGE_LIMIT = 6;

function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Nilai input form (belum dikirim)
  const [searchInput, setSearchInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');

  // Nilai yang benar-benar dikirim ke backend
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const { stalls, meta, isLoading, error, reload } = useStalls({
    search: search || undefined,
    category: category || undefined,
    page,
    limit: PAGE_LIMIT,
  });

  const hasFilters = search !== '' || category !== '';
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  function handleSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSearch(searchInput.trim());
    setCategory(categoryInput.trim());
    setPage(1);
  }

  function handleResetFilters(): void {
    setSearchInput('');
    setCategoryInput('');
    setSearch('');
    setCategory('');
    setPage(1);
  }

  return (
    <>
      <section className="page-header">
        <div>
          <h1>Daftar Warung</h1>
          <p className="page-subtitle">
            Jelajahi berbagai pilihan makanan dan minuman di kantin kampus.
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={reload}
            disabled={isLoading}
          >
            {isLoading ? 'Memuat...' : 'Muat Ulang'}
          </button>

          {canCreateStall(user) ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/stalls/new')}
            >
              + Tambah Warung
            </button>
          ) : null}
        </div>
      </section>

      <form className="filter-bar" onSubmit={handleSearch}>
        <input
          type="search"
          placeholder="Masukkan nama warung"
          value={searchInput}
          maxLength={100}
          onChange={(event) => setSearchInput(event.target.value)}
          aria-label="Cari nama warung"
        />
        <input
          type="text"
          placeholder="Masukkan kategori"
          value={categoryInput}
          maxLength={50}
          onChange={(event) => setCategoryInput(event.target.value)}
          aria-label="Filter kategori"
        />
        <button type="submit" className="btn btn-primary">
          Cari
        </button>
        {hasFilters ? (
          <button type="button" className="btn btn-ghost" onClick={handleResetFilters}>
            Reset
          </button>
        ) : null}
      </form>

      <section aria-label="Daftar warung">
        {isLoading ? (
          <StatePanel variant="loading" message="Memuat daftar warung..." />
        ) : error ? (
          <StatePanel
            variant="error"
            title="Daftar warung gagal dimuat"
            message={error}
            actionLabel="Coba Lagi"
            onAction={reload}
          />
        ) : stalls.length === 0 ? (
          <StatePanel
            variant="empty"
            title={hasFilters ? 'Warung tidak ditemukan' : 'Belum ada warung'}
            message={
              hasFilters
                ? 'Tidak ada warung yang cocok dengan pencarian. Coba kata kunci atau kategori lain.'
                : 'Belum ada warung yang terdaftar.'
            }
            actionLabel={hasFilters ? 'Reset Pencarian' : undefined}
            onAction={hasFilters ? handleResetFilters : undefined}
          />
        ) : (
          <>
            <div className="stall-grid">
              {stalls.map((stall) => (
                <StallCard
                  key={stall.id}
                  stall={stall}
                  isMine={user?.role === 'owner' && stall.ownerId === user.id}
                />
              ))}
            </div>

            {totalPages > 1 ? (
              <nav className="pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPage((current) => current - 1)}
                  disabled={page <= 1}
                >
                  ← Sebelumnya
                </button>
                <span>
                  Halaman {page} dari {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={page >= totalPages}
                >
                  Berikutnya →
                </button>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </>
  );
}

export default HomePage;
