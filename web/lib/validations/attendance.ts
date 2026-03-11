import { z } from 'zod'

/**
 * Schema untuk Check-in
 */
export const CheckInSchema = z.object({
  photo_base64: z.string().min(100, 'Foto tidak valid (terlalu pendek)'),
  latitude:     z.number().min(-90).max(90),
  longitude:    z.number().min(-180).max(180),
  address:      z.string().optional(),
  device_info:  z.object({
    os:        z.string().optional(),
    browser:   z.string().optional(),
    device_id: z.string().optional(),
  }).optional(),
})

/**
 * Schema untuk Check-out
 */
export const CheckOutSchema = z.object({
  photo_base64: z.string().min(100, 'Foto tidak valid (terlalu pendek)'),
  latitude:     z.number().min(-90).max(90),
  longitude:    z.number().min(-180).max(180),
  address:      z.string().optional(),
})

/**
 * Schema untuk Query List Absensi
 */
export const AttendanceQuerySchema = z.object({
  page:          z.coerce.number().default(1),
  limit:         z.coerce.number().min(1).max(100).default(20),
  month:         z.string().regex(/^\d{4}-\d{2}$/, 'Format bulan harus YYYY-MM').optional(),
  employee_id:   z.string().uuid().optional(),
  status:        z.enum(['PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'HOLIDAY', 'WFH']).optional(),
  department_id: z.string().uuid().optional(),
  sort_dir:      z.enum(['asc', 'desc']).default('desc'),
})

/**
 * Schema untuk Pengajuan Koreksi Absensi
 */
export const CorrectionSchema = z.object({
  attendance_id:   z.string().uuid('ID Absensi tidak valid'),
  after_check_in:  z.string().datetime({ message: 'Waktu check-in tidak valid (ISO 8601)' }),
  after_check_out: z.string().datetime({ message: 'Waktu check-out tidak valid (ISO 8601)' }).optional().nullable(),
  after_status_id: z.string().uuid('ID Status tidak valid'),
  reason:          z.string().min(10, 'Alasan wajib diisi minimal 10 karakter'),
})
