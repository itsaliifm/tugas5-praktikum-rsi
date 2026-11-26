// Helper tampilan audit log

const actionLabels: Record<string, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  CREATE_STALL: 'Tambah warung',
  UPDATE_STALL: 'Ubah warung',
  DELETE_STALL: 'Hapus warung',
  CREATE_MENU: 'Tambah menu',
  UPDATE_MENU: 'Ubah menu',
  DELETE_MENU: 'Hapus menu',
  CREATE_REVIEW: 'Tambah review',
  DELETE_REVIEW: 'Hapus review',
};

const targetLabels: Record<string, string> = {
  USERS: 'Pengguna',
  STALLS: 'Warung',
  MENU_ITEMS: 'Menu',
  REVIEWS: 'Review',
};

export const auditActionOptions = Object.entries(actionLabels).map(([value, label]) => ({
  value,
  label,
}));

export const auditTargetOptions = Object.entries(targetLabels).map(([value, label]) => ({
  value,
  label,
}));

export function actionLabel(action: string): string {
  return actionLabels[action] ?? action;
}

export function targetLabel(targetTable: string): string {
  return targetLabels[targetTable] ?? targetTable;
}

// Kelas CSS badge berdasarkan jenis aksi
export function actionClass(action: string): string {
  if (action === 'LOGIN' || action === 'LOGOUT') return 'badge-auth';
  if (action.startsWith('CREATE_')) return 'badge-create';
  if (action.startsWith('UPDATE_')) return 'badge-update';
  if (action.startsWith('DELETE_')) return 'badge-delete';
  return 'badge-category';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Mengambil satu nilai teks dari metadata (misalnya ip_address)
export function metadataText(metadata: unknown, key: string): string | null {
  if (!isRecord(metadata)) return null;
  const value = metadata[key];
  return typeof value === 'string' ? value : null;
}

// Ringkasan singkat untuk kolom tabel
export function describeMetadata(metadata: unknown): string {
  if (!isRecord(metadata)) return 'Tidak ada detail';

  if (typeof metadata.result === 'string') {
    const result = metadata.result === 'success' ? 'berhasil' : 'gagal';
    return `Role ${String(metadata.role ?? '-')}, ${result}`;
  }

  if (Array.isArray(metadata.changed)) {
    return metadata.changed.length > 0
      ? `Field: ${metadata.changed.join(', ')}`
      : 'Tidak ada field berubah';
  }

  for (const key of ['after', 'before']) {
    const value = metadata[key];
    if (isRecord(value) && typeof value.name === 'string') return value.name;
  }

  return 'Lihat detail';
}

// JSON metadata yang rapi untuk modal detail
export function formatMetadata(metadata: unknown): string {
  if (metadata === null || metadata === undefined) return 'Tidak ada metadata.';
  if (typeof metadata === 'string') return metadata;

  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return String(metadata);
  }
}

// Waktu disimpan UTC di database, ditampilkan sesuai zona waktu browser
export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date);
}
