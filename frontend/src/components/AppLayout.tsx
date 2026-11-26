// Navbar dan konten halaman. Toast dikirim lewat navigate state.
import { startTransition, useCallback, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canCreateStall, roleLabels } from '../lib/permissions';
import Toast, { type ToastData } from './Toast';

function AppLayout() {
  const { user, isReady, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navToast = (location.state as { toast?: ToastData } | null)?.toast;
  const toast = navToast && dismissedKey !== location.key ? navToast : null;

  const closeToast = useCallback(() => {
    setDismissedKey(location.key);
  }, [location.key]);

  async function handleLogout(): Promise<void> {
    setIsLoggingOut(true);
    // Pindah ke beranda dulu agar halaman terproteksi tidak redirect ke /login.
    startTransition(() => {
      navigate('/', {
        state: { toast: { type: 'success', message: 'Berhasil logout. Sampai jumpa!' } },
      });
    });
    await logout();
    setIsLoggingOut(false);
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="brand">
            Kantin<span>.</span>
          </Link>

          <nav className="nav-links">
            <NavLink to="/" end>
              Warung
            </NavLink>

            {canCreateStall(user) ? (
              <NavLink to="/stalls/new">Tambah Warung</NavLink>
            ) : null}

            {user?.role === 'admin' ? <NavLink to="/audit-logs">Audit Log</NavLink> : null}

            {!isReady ? null : user ? (
              <>
                <NavLink to="/profile" className="nav-user">
                  {user.name}
                  <span className={`badge badge-role role-${user.role}`}>
                    {roleLabels[user.role]}
                  </span>
                </NavLink>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => void handleLogout()}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? 'Keluar...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Daftar
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="container">
        {toast ? <Toast toast={toast} onClose={closeToast} /> : null}
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
