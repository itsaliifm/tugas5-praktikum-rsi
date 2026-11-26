// Menjaga halaman yang butuh login / role tertentu.
// - Belum login        -> diarahkan ke /login?redirect=...
// - Role tidak sesuai  -> diarahkan ke /forbidden
// Ini hanya mengatur navigasi. Keputusan akhir tetap di backend (401/403).
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';
import StatePanel from './StatePanel';

interface ProtectedRouteProps {
  roles?: UserRole[];
}

function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <StatePanel variant="loading" message="Memeriksa sesi login..." />;
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
