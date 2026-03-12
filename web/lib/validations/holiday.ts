import { z } from 'zod'

export const HolidaySchema = z.object({
  name: z.string().min(2, 'Nama hari libur minimal 2 karakter').max(255),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  is_national: z.boolean().default(false),
})

export const HolidayQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  year: z.string().regex(/^\d{4}$/).optional(),
  sort_dir: z.enum(['asc', 'desc']).default('asc'),
})

export type HolidayInput = z.infer<typeof HolidaySchema>
export type HolidayQuery = z.infer<typeof HolidayQuerySchema>
