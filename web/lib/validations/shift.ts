import { z } from 'zod'

export const ShiftSchema = z.object({
  name: z.string().min(2, 'Nama shift minimal 2 karakter'),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Format waktu HH:mm atau HH:mm:ss'),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Format waktu HH:mm atau HH:mm:ss'),
  is_overnight: z.boolean().default(false),
  late_tolerance_minutes: z.number().min(0).max(120).default(15),
  break_duration_minutes: z.number().min(0).max(120).default(60),
})

export const ShiftQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_dir: z.enum(['asc', 'desc']).default('asc'),
})

export const AssignShiftSchema = z.object({
  shift_id: z.string().uuid('ID Shift tidak valid'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD').nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.end_date && data.end_date < data.start_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
      path: ['end_date'],
    })
  }
})

export type ShiftInput = z.infer<typeof ShiftSchema>
export type ShiftQuery = z.infer<typeof ShiftQuerySchema>
export type AssignShiftInput = z.infer<typeof AssignShiftSchema>
