// ============================================================
// lib/validations/employee.ts
// Zod schemas untuk Employee endpoints
// ============================================================
import { z } from 'zod'

export const CreateEmployeeSchema = z.object({
  employee_code:     z.string().max(50).optional(),
  full_name:         z.string({ required_error: 'Nama lengkap wajib diisi' }).min(2).max(255).trim(),
  phone:             z.string().max(30).optional().nullable(),
  department_id:     z.string().uuid('Department tidak valid').optional().nullable(),
  position_id:       z.string().uuid('Posisi tidak valid').optional().nullable(),
  manager_id:        z.string().uuid('Manager tidak valid').optional().nullable(),
  work_location_id:  z.string().uuid('Lokasi kerja tidak valid').optional().nullable(),
  hire_date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD').optional().nullable(),
  employment_status: z.enum(['active', 'inactive', 'resigned', 'terminated']).default('active'),
  // Personal data
  birth_date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  gender:            z.enum(['male', 'female']).optional().nullable(),
  marital_status:    z.enum(['single', 'married', 'divorced']).optional().nullable(),
  national_id:       z.string().max(30).optional().nullable(),
  address:           z.string().optional().nullable(),
  // Auth — email untuk buat akun Supabase
  email:             z.string({ required_error: 'Email wajib diisi' })
                      .email('Format email tidak valid')
                      .toLowerCase()
                      .trim(),
  // Password awal (opsional — kalau tidak diisi, kirim invite email)
  password:          z.string().min(8, 'Password minimal 8 karakter').optional(),
})

export const UpdateEmployeeSchema = CreateEmployeeSchema
  .omit({ email: true, password: true })  // email tidak bisa diubah via endpoint ini
  .partial()

export const EmployeeQuerySchema = z.object({
  page:              z.coerce.number().min(1).default(1),
  limit:             z.coerce.number().min(1).max(100).default(20),
  search:            z.string().optional(),
  department_id:     z.string().uuid().optional(),
  position_id:       z.string().uuid().optional(),
  employment_status: z.enum(['active', 'inactive', 'resigned', 'terminated']).optional(),
  sort_by:           z.enum(['full_name', 'employee_code', 'hire_date', 'created_at']).default('full_name'),
  sort_dir:          z.enum(['asc', 'desc']).default('asc'),
})

export const FaceRegisterSchema = z.object({
  photo_base64: z.string({ required_error: 'Foto wajib diupload' }).min(100, 'Foto tidak valid'),
})
