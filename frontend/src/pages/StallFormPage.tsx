// Form tambah warung (POST /stalls) dan edit warung (PUT /stalls/:id).
// Halaman ini dijaga ProtectedRoute untuk role owner & admin.
// Kepemilikan warung (owner hanya boleh edit miliknya) diperiksa oleh backend,
// sehingga jika owner membuka /stalls/:id/edit milik orang lain lewat URL,
// backend akan membalas 403 dan pesannya ditampilkan di form.
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StatePanel from '../components/StatePanel';
import { useAuth } from '../context/AuthContext';
import { canEditStall } from '../lib/permissions';
import {
  getFieldErrors,
  toStallPayload,
  validateStallForm,
  type StallFormErrors,
  type StallFormValues,
} from '../lib/validation';
import { ApiError, createStall, getStallById, updateStall } from '../services/api';
import type { Stall } from '../types/stall';

const emptyValues: StallFormValues = {
  name: '',
  category: '',
  location: '',
  description: '',
};

function toFormValues(stall: Stall): StallFormValues {
  return {
    name: stall.name,
    category: stall.category ?? '',
    location: stall.location ?? '',
    description: stall.description ?? '',
  };
}

function StallFormPage() {
  const { id } = useParams();
  const isEdit = id !== undefined;
  const stallId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stall, setStall] = useState<Stall | null>(null);
  const [values, setValues] = useState<StallFormValues>(emptyValues);
  const [errors, setErrors] = useState<StallFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Mode edit: ambil data warung lama untuk mengisi form
  useEffect(() => {
    if (!isEdit) return;

    let cancelled = false;

    getStallById(stallId)
      .then((data) => {
        if (cancelled) return;
        setStall(data);
        setValues(toFormValues(data));
      })
      .catch((caughtError: unknown) => {
        if (cancelled) return;
        setLoadError(
          caughtError instanceof Error ? caughtError.message : 'Gagal memuat data warung.',
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, stallId]);

  function updateField(field: keyof StallFormValues, value: string): void {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    // 1. Validasi di frontend dulu
    const validationErrors = validateStallForm(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    setErrors({});
    setServerError(null);

    // 2. Kirim ke backend
    try {
      const payload = toStallPayload(values);
      const saved = isEdit
        ? await updateStall(stallId, payload)
        : await createStall(payload);

      navigate(`/stalls/${saved.id}`, {
        state: {
          toast: {
            type: 'success',
            message: isEdit
              ? `Warung "${saved.name}" berhasil diperbarui.`
              : `Warung "${saved.name}" berhasil ditambahkan.`,
          },
        },
      });
    } catch (caughtError) {
      // 3. Tampilkan error dari backend (400 validasi, 401, 403, 404, 500)
      if (caughtError instanceof ApiError) {
        setErrors(getFieldErrors(caughtError.details) as StallFormErrors);
        setServerError(caughtError.message);
      } else {
        setServerError('Gagal menyimpan data warung.');
      }
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <StatePanel variant="loading" message="Memuat data warung..." />;
  }

  if (loadError) {
    return (
      <StatePanel
        variant="error"
        title="Data warung gagal dimuat"
        message={loadError}
        actionLabel="Kembali ke Daftar"
        onAction={() => navigate('/')}
      />
    );
  }

  const isNotOwner = isEdit && stall !== null && !canEditStall(user, stall);

  return (
    <>
      <Link to={isEdit ? `/stalls/${stallId}` : '/'} className="back-link">
        ← Batal dan kembali
      </Link>

      <section className="form-card">
        <h1>{isEdit ? 'Edit Warung' : 'Tambah Warung'}</h1>
        <p className="page-subtitle">
          {isEdit
            ? 'Perbarui informasi warung.'
            : 'Lengkapi data warung baru.'}
        </p>

        {isNotOwner ? (
          <div className="alert alert-warning" role="alert">
            Warung ini bukan milikmu, jadi perubahan tidak dapat disimpan.
          </div>
        ) : null}

        {serverError ? (
          <div className="alert alert-error" role="alert">
            {serverError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="stall-name">Nama warung *</label>
            <input
              id="stall-name"
              type="text"
              value={values.name}
              onChange={(event) => updateField('name', event.target.value)}
              disabled={isSaving}
              placeholder="Masukkan nama warung"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? <p className="field-error">{errors.name}</p> : null}
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="stall-category">Kategori</label>
              <input
                id="stall-category"
                type="text"
                value={values.category}
                onChange={(event) => updateField('category', event.target.value)}
                disabled={isSaving}
                placeholder="Masukkan kategori"
                aria-invalid={Boolean(errors.category)}
              />
              {errors.category ? <p className="field-error">{errors.category}</p> : null}
            </div>

            <div className="field">
              <label htmlFor="stall-location">Lokasi</label>
              <input
                id="stall-location"
                type="text"
                value={values.location}
                onChange={(event) => updateField('location', event.target.value)}
                disabled={isSaving}
                placeholder="Masukkan lokasi warung"
                aria-invalid={Boolean(errors.location)}
              />
              {errors.location ? <p className="field-error">{errors.location}</p> : null}
            </div>
          </div>

          <div className="field">
            <label htmlFor="stall-description">Deskripsi</label>
            <textarea
              id="stall-description"
              rows={4}
              value={values.description}
              onChange={(event) => updateField('description', event.target.value)}
              disabled={isSaving}
              placeholder="Masukkan deskripsi warung"
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description ? <p className="field-error">{errors.description}</p> : null}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate(isEdit ? `/stalls/${stallId}` : '/')}
              disabled={isSaving}
            >
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Warung'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

export default StallFormPage;
