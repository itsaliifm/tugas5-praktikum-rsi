import { z } from 'zod';

// Format YYYY-MM-DD dan harus tanggal yang benar-benar ada di kalender
// (misalnya 2026-02-30 ditolak).
const dateOnly = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Gunakan format tanggal YYYY-MM-DD.')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return false;

    const [year, month, day] = value.split('-').map(Number);

    return (
      date.getFullYear() === year &&
      date.getMonth() + 1 === month &&
      date.getDate() === day
    );
  }, 'Tanggal tidak valid.');

const positiveInt = (label: string) =>
  z.coerce
    .number({ message: `${label} harus berupa angka.` })
    .int(`${label} harus bilangan bulat.`)
    .positive(`${label} harus bilangan bulat positif.`);

export const auditLogQuerySchema = z
  .object({
    page: z.coerce
      .number({ message: 'page harus berupa angka.' })
      .int('page harus bilangan bulat.')
      .min(1, 'page minimal 1.')
      .default(1),
    pageSize: z.coerce
      .number({ message: 'pageSize harus berupa angka.' })
      .int('pageSize harus bilangan bulat.')
      .min(1, 'pageSize minimal 1.')
      .max(100, 'pageSize maksimal 100.')
      .default(20),
    action: z.string().trim().max(50, 'action maksimal 50 karakter.').optional(),
    targetTable: z.string().trim().max(50, 'targetTable maksimal 50 karakter.').optional(),
    targetId: positiveInt('targetId').optional(),
    userId: positiveInt('userId').optional(),
    from: dateOnly.optional(),
    to: dateOnly.optional(),
  })
  // Parameter yang tidak dikenal ditolak 400.
  .strict()
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: 'Tanggal awal (from) tidak boleh melewati tanggal akhir (to).',
    path: ['from'],
  });

export const auditLogIdSchema = z.object({
  id: positiveInt('id'),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
