import { z } from 'zod'

export const CreatePositionSchema = z.object({
  name:        z.string({ required_error: 'Nama jabatan wajib diisi' }).min(2).max(255).trim(),
  description: z.string().max(1000).optional().nullable(),
})

export const UpdatePositionSchema = CreatePositionSchema.partial()
