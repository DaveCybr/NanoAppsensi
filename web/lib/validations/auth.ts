// ============================================================
// lib/validations/auth.ts
// Zod schemas untuk validasi request Auth
// ============================================================
import { z } from 'zod'

export const LoginSchema = z.object({
  email: z
    .string({ required_error: 'Email wajib diisi' })
    .email('Format email tidak valid')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password wajib diisi' })
    .min(6, 'Password minimal 6 karakter'),
})

export const RefreshTokenSchema = z.object({
  refresh_token: z.string({ required_error: 'Refresh token wajib diisi' }).min(1),
})

// ── Pagination query schema (reusable) ────────────────────
export const PaginationSchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  limit:    z.coerce.number().min(1).max(100).default(20),
  search:   z.string().optional(),
  sort_by:  z.string().optional(),
  sort_dir: z.enum(['asc', 'desc']).default('desc'),
})

// ── Helper: parse query params ke object ──────────────────
export function parseQueryParams(searchParams: URLSearchParams): Record<string, string> {
  const result: Record<string, string> = {}
  searchParams.forEach((value, key) => { result[key] = value })
  return result
}
