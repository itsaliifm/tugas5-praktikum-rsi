// Validasi form di frontend. Backend tetap memvalidasi ulang dengan zod.
import type { ApiErrorDetail } from '../types/api';
import type { StallPayload } from '../types/stall';
import type { LoginPayload, RegisterPayload } from '../types/auth';

// ==============================
// FORM WARUNG
// ==============================

export interface StallFormValues {
  name: string;
  category: string;
  location: string;
  description: string;
}

export type StallFormErrors = Partial<Record<keyof StallFormValues, string>>;

// Mengikuti createStallSchema di backend
export function validateStallForm(values: StallFormValues): StallFormErrors {
  const errors: StallFormErrors = {};
  const name = values.name.trim();

  if (name.length < 3) {
    errors.name = 'Nama warung minimal 3 karakter.';
  } else if (name.length > 100) {
    errors.name = 'Nama warung maksimal 100 karakter.';
  }

  if (values.category.trim().length > 50) {
    errors.category = 'Kategori maksimal 50 karakter.';
  }

  if (values.location.trim().length > 100) {
    errors.location = 'Lokasi maksimal 100 karakter.';
  }

  if (values.description.trim().length > 1000) {
    errors.description = 'Deskripsi maksimal 1000 karakter.';
  }

  return errors;
}

export function toStallPayload(values: StallFormValues): StallPayload {
  return {
    name: values.name.trim(),
    category: values.category.trim(),
    location: values.location.trim(),
    description: values.description.trim(),
  };
}

// ==============================
// FORM LOGIN & REGISTER
// ==============================

export type LoginFormErrors = Partial<Record<keyof LoginPayload, string>>;
export type RegisterFormErrors = Partial<Record<keyof RegisterPayload, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mengikuti loginSchema di backend
export function validateLoginForm(values: LoginPayload): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.email.trim()) {
    errors.email = 'Email wajib diisi.';
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = 'Format email tidak valid.';
  }

  if (!values.password) {
    errors.password = 'Password wajib diisi.';
  }

  return errors;
}

// Mengikuti registerSchema di backend
export function validateRegisterForm(values: RegisterPayload): RegisterFormErrors {
  const errors: RegisterFormErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();

  if (name.length < 3) {
    errors.name = 'Nama minimal 3 karakter.';
  } else if (name.length > 100) {
    errors.name = 'Nama maksimal 100 karakter.';
  }

  if (!email) {
    errors.email = 'Email wajib diisi.';
  } else if (!emailPattern.test(email) || email.length > 150) {
    errors.email = 'Format email tidak valid (maks. 150 karakter).';
  }

  if (values.password.length < 8) {
    errors.password = 'Password minimal 8 karakter.';
  } else if (values.password.length > 72) {
    errors.password = 'Password maksimal 72 karakter.';
  }

  return errors;
}

// ==============================
// ERROR VALIDASI DARI BACKEND
// ==============================

// "body.name" -> { name: 'pesan' }
export function getFieldErrors(details: ApiErrorDetail[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (const detail of details) {
    const field = detail.field.replace(/^(body|params|query)\./, '');

    if (!result[field]) {
      result[field] = detail.message;
    }
  }

  return result;
}
