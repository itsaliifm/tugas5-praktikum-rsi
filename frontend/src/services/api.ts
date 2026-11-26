import type {
  ApiEnvelope,
  ApiErrorDetail,
} from '../types/api';

import type {
  Stall,
  StallListResult,
  StallPayload,
  StallQuery,
} from '../types/stall';

import type {
  AuditLog,
  AuditLogFilters,
  AuditLogList,
} from '../types/auditLog';

import type {
  User,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
} from '../types/auth';

// URL backend (diatur lewat VITE_API_BASE_URL di file .env)
const fallbackBaseUrl = 'http://localhost:3000/api/v1';
const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = (envBaseUrl || fallbackBaseUrl).replace(/\/$/, '');

// Nama key token JWT di localStorage
const TOKEN_KEY = 'token';

// Nama event yang dikirim ketika token ditolak backend (401)
export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

// ==============================
// TOKEN
// ==============================

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Error API
export class ApiError extends Error {
  readonly status: number;
  readonly details: ApiErrorDetail[];

  constructor(
    message: string,
    status: number,
    details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Memeriksa apakah data merupakan object
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Memeriksa format detail error
function isErrorDetail(value: unknown): value is ApiErrorDetail {
  return (
    isRecord(value) &&
    typeof value.field === 'string' &&
    typeof value.message === 'string'
  );
}

// Fungsi utama untuk request API.
// Mengembalikan seluruh isi response ({ status, message, meta, data }).
export async function requestEnvelope<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init.headers);

  headers.set('Accept', 'application/json');

  // Mengambil token dari localStorage lalu mengirimnya sebagai Bearer token
  const token = getToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });
  } catch {
    // fetch hanya melempar error ketika jaringan gagal (backend mati, CORS, dll)
    throw new ApiError(
      'Tidak dapat terhubung ke server. Coba lagi beberapa saat lagi.',
      0,
    );
  }

  // Jika tidak ada response body
  if (response.status === 204) {
    return { status: 'success', data: undefined as T };
  }

  const rawBody = await response.text();
  let payload: unknown = null;

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = null;
    }
  }

  // fetch tidak melempar error untuk 4xx/5xx, cek response.ok
  if (!response.ok) {
    const failure = isRecord(payload) ? payload : {};

    const message =
      typeof failure.message === 'string'
        ? failure.message
        : 'Terjadi kesalahan. Coba lagi.';

    const details = Array.isArray(failure.errors)
      ? failure.errors.filter(isErrorDetail)
      : [];

    // Token kedaluwarsa / tidak valid: hapus token dan beri tahu AuthContext
    if (response.status === 401 && token) {
      removeToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    throw new ApiError(message, response.status, details);
  }

  // Memeriksa format response
  if (!isRecord(payload) || !('data' in payload)) {
    throw new ApiError(
      'Respons server tidak memiliki format yang valid.',
      response.status,
    );
  }

  return payload as unknown as ApiEnvelope<T>;
}

// Versi singkat: hanya mengembalikan bagian data
export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const envelope = await requestEnvelope<T>(path, init);
  return envelope.data;
}

// ==============================
// STALL API
// ==============================

// Mengambil daftar warung (dengan search, filter kategori, dan pagination)
export async function getStalls(
  query: StallQuery = {},
): Promise<StallListResult> {
  const params = new URLSearchParams();

  if (query.search) params.set('search', query.search);
  if (query.category) params.set('category', query.category);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));

  const queryString = params.toString();
  const path = queryString ? `/stalls?${queryString}` : '/stalls';

  const envelope = await requestEnvelope<Stall[]>(path);

  return {
    stalls: envelope.data,
    meta: envelope.meta ?? {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      total: envelope.data.length,
    },
  };
}

// Mengambil detail warung berdasarkan ID
export function getStallById(id: number): Promise<Stall> {
  return request<Stall>(`/stalls/${id}`);
}

// Membuat warung baru (owner, admin)
export function createStall(payload: StallPayload): Promise<Stall> {
  return request<Stall>('/stalls', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Mengubah data warung (owner pemilik, admin)
export function updateStall(
  id: number,
  payload: Partial<StallPayload>,
): Promise<Stall> {
  return request<Stall>(`/stalls/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// Menghapus warung (admin)
export function deleteStall(id: number): Promise<Stall> {
  return request<Stall>(`/stalls/${id}`, {
    method: 'DELETE',
  });
}

// ==============================
// AUTH API
// ==============================

// Registrasi akun (backend otomatis memberi role customer)
export function register(payload: RegisterPayload): Promise<User> {
  return request<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Login akun
export async function login(
  payload: LoginPayload,
): Promise<LoginResponse> {
  const data = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  // Menyimpan token setelah login berhasil
  saveToken(data.token);

  return data;
}

// Mengambil data user yang sedang login
export function getMe(): Promise<User> {
  return request<User>('/auth/me');
}

// Logout: POST /auth/logout, token tetap dihapus walaupun request gagal
export async function logout(): Promise<void> {
  try {
    if (getToken()) {
      await request<null>('/auth/logout', { method: 'POST' }).catch(() => undefined);
    }
  } finally {
    removeToken();
  }
}

// ==============================
// AUDIT LOG API (admin)
// ==============================

// Mengambil riwayat audit dengan filter dan pagination
export function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogList> {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  const queryString = params.toString();
  return request<AuditLogList>(queryString ? `/audit-logs?${queryString}` : '/audit-logs');
}

// Mengambil satu catatan audit berdasarkan ID
export function getAuditLogById(id: number): Promise<AuditLog> {
  return request<AuditLog>(`/audit-logs/${id}`);
}
