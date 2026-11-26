// Response sukses dari backend:
// { status: 'success', message?, meta?, data }
export interface ApiEnvelope<T> {
  status: 'success';
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

// Informasi pagination dari GET /stalls
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

// Detail error validasi dari backend (zod), contoh:
// { field: 'body.name', message: 'Too small: ...' }
export interface ApiErrorDetail {
  field: string;
  message: string;
}
