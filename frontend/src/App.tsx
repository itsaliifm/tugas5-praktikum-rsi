// Routing aplikasi
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';

import AppLayout from './components/AppLayout';
import AuditLogPage from './pages/AuditLogPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import ForbiddenPage from './pages/ForbiddenPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import StallDetailPage from './pages/StallDetailPage';
import StallFormPage from './pages/StallFormPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Public */}
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forbidden" element={<ForbiddenPage />} />

            {/* Owner & admin: tambah dan edit warung.
                Didaftarkan sebelum stalls/:id agar "new" tidak dianggap ID. */}
            <Route element={<ProtectedRoute roles={['owner', 'admin']} />}>
              <Route path="stalls/new" element={<StallFormPage />} />
              <Route path="stalls/:id/edit" element={<StallFormPage />} />
            </Route>

            <Route path="stalls/:id" element={<StallDetailPage />} />

            {/* Admin */}
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="audit-logs" element={<AuditLogPage />} />
            </Route>

            {/* Semua role yang sudah login */}
            <Route element={<ProtectedRoute />}>
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
