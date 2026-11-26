/* eslint-disable react-refresh/only-export-components */
// Data user yang sedang login (token JWT di localStorage)
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import * as api from '../services/api';
import type { LoginPayload, RegisterPayload, User } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  isReady: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  // Tanpa token berarti belum login, jadi tidak perlu menunggu GET /auth/me
  const [isReady, setIsReady] = useState(() => !api.getToken());

  useEffect(() => {
    let active = true;

    // Dipanggil oleh services/api.ts ketika backend membalas 401
    const handleUnauthorized = () => {
      if (active) setUser(null);
    };

    window.addEventListener(api.UNAUTHORIZED_EVENT, handleUnauthorized);

    // Saat aplikasi dibuka: kalau ada token, cek ke GET /auth/me
    if (api.getToken()) {
      api
        .getMe()
        .then((currentUser) => {
          if (active) setUser(currentUser);
        })
        .catch(() => {
          // Token tidak valid / backend mati: anggap belum login
          if (active) setUser(null);
        })
        .finally(() => {
          if (active) setIsReady(true);
        });
    }

    return () => {
      active = false;
      window.removeEventListener(api.UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await api.login(payload);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    return api.register(payload);
  }, []);

  // Memanggil POST /auth/logout (audit LOGOUT di backend), lalu menghapus sesi
  const logout = useCallback(async () => {
    await api.logout();
    // Dibungkus transition agar navigasi selesai dulu
    startTransition(() => setUser(null));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isReady, login, register, logout }),
    [user, isReady, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }

  return context;
}
