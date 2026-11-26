// Registrasi: POST /auth/register (role default customer)
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getFieldErrors,
  validateRegisterForm,
  type RegisterFormErrors,
} from '../lib/validation';
import { ApiError } from '../services/api';
import type { RegisterPayload } from '../types/auth';

function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<RegisterPayload>({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  function updateField(field: keyof RegisterPayload, value: string): void {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const validationErrors = validateRegisterForm(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const newUser = await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });

      // Arahkan ke login dengan email yang sudah terisi
      navigate('/login', {
        state: {
          email: newUser.email,
          toast: { type: 'success', message: 'Registrasi berhasil. Silakan login.' },
        },
      });
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setErrors(getFieldErrors(caughtError.details) as RegisterFormErrors);
        // Contoh: 409 "Email sudah terdaftar"
        setServerError(caughtError.message);
      } else {
        setServerError('Registrasi gagal. Coba lagi.');
      }
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <h1>Daftar Akun</h1>
      <p className="page-subtitle">
        Akun baru otomatis terdaftar sebagai <strong>customer</strong>.
      </p>

      {serverError ? (
        <div className="alert alert-error" role="alert">
          {serverError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="register-name">Nama</label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            disabled={isSubmitting}
            placeholder="Masukkan nama lengkap"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name ? <p className="field-error">{errors.name}</p> : null}
        </div>

        <div className="field">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
            disabled={isSubmitting}
            placeholder="Masukkan email"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? <p className="field-error">{errors.email}</p> : null}
        </div>

        <div className="field">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(event) => updateField('password', event.target.value)}
            disabled={isSubmitting}
            placeholder="Masukkan password (minimal 8 karakter)"
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password ? <p className="field-error">{errors.password}</p> : null}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? 'Mendaftarkan...' : 'Daftar'}
        </button>
      </form>

      <p className="auth-switch">
        Sudah punya akun? <Link to="/login">Login di sini</Link>
      </p>
    </section>
  );
}

export default RegisterPage;
