import { z } from 'zod'

export const CreateDepartmentSchema = z.object({
  name:        z.string({ required_error: 'Nama departemen wajib diisi' }).min(2).max(255).trim(),
  description: z.string().max(1000).optional().nullable(),
})

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial()
