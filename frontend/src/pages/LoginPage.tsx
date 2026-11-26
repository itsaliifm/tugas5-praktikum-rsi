// Halaman login: POST /auth/login, token disimpan di localStorage.
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFieldErrors, validateLoginForm, type LoginFormErrors } from '../lib/validation';
import { ApiError } from '../services/api';
import type { LoginPayload } from '../types/auth';

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Email bisa dikirim dari halaman register setelah berhasil daftar
  const registeredEmail = (location.state as { email?: string } | null)?.email ?? '';

  const [values, setValues] = useState<LoginPayload>({
    email: registeredEmail,
    password: '',
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hanya izinkan redirect ke path internal
  const redirectParam = searchParams.get('redirect') ?? '/';
  const redirectTo = redirectParam.startsWith('/') && !redirectParam.startsWith('//')
    ? redirectParam
    : '/';

  // Sudah login: tidak perlu membuka halaman login lagi
  if (user && !isSubmitting) {
    return <Navigate to="/" replace />;
  }

  function updateField(field: keyof LoginPayload, value: string): void {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const validationErrors = validateLoginForm(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const loggedInUser = await login({
        email: values.email.trim(),
        password: values.password,
      });

      navigate(redirectTo, {
        replace: true,
        state: {
          toast: { type: 'success', message: `Login berhasil. Halo, ${loggedInUser.name}!` },
        },
      });
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setErrors(getFieldErrors(caughtError.details) as LoginFormErrors);
        setServerError(caughtError.message);
      } else {
        setServerError('Login gagal. Coba lagi.');
      }
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <h1>Masuk</h1>
      <p className="page-subtitle">Login untuk mengelola warung sesuai role akunmu.</p>

      {serverError ? (
        <div className="alert alert-error" role="alert">
          {serverError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
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
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Masukkan password"
            value={values.password}
            onChange={(event) => updateField('password', event.target.value)}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password ? <p className="field-error">{errors.password}</p> : null}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? 'Memproses...' : 'Login'}
        </button>
      </form>

      <p className="auth-switch">
        Belum punya akun? <Link to="/register">Daftar di sini</Link>
      </p>
    </section>
  );
}

export default LoginPage;
