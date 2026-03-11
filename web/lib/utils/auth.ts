// ============================================================
// lib/utils/auth.ts
// Auth helpers — extract user, validasi token, ambil permissions
// ============================================================
import { NextRequest } from 'next/server'
import { createClient, createBearerClient } from '@/lib/supabase/server'
import { unauthorized } from '@/lib/utils/response'
import { AuthUser } from '@/types/api'

// ── Extract authenticated user dari request ────────────────
// Support dua mode:
//   1. Cookie session  → web admin panel
//   2. Bearer token    → Flutter mobile
export async function getAuthUser(request: NextRequest): Promise<{
  user: AuthUser
  supabase: ReturnType<typeof createClient>
} | null> {
  // Cek Bearer token dulu (Flutter)
  const authHeader = request.headers.get('Authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const supabase = createBearerClient(token)

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const authUser = await buildAuthUser(supabase, user.id)
    if (!authUser) return null

    return { user: authUser, supabase }
  }

  // Fallback ke cookie session (web)
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const authUser = await buildAuthUser(supabase, user.id)
  if (!authUser) return null

  return { user: authUser, supabase }
}

// ── Build AuthUser dari database ───────────────────────────
async function buildAuthUser(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, email, full_name, tenant_id, is_active,
      role:roles(name),
      employee:employees!employees_user_id_fkey(id)
    `)
    .eq('id', userId)
    .single()

  if (error || !data) return null
  if (!data.is_active) return null

  const role = data.role as { name: string } | null
  const employee = data.employee as { id: string }[] | null

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    tenant_id: data.tenant_id,
    role_name: role?.name ?? null,
    employee_id: employee?.[0]?.id ?? null,
    is_active: data.is_active,
  }
}

// ── Permission check helpers ───────────────────────────────

export function isHrOrAdmin(user: AuthUser): boolean {
  return user.role_name === 'Admin' || user.role_name === 'HR Manager'
}

export function isAdmin(user: AuthUser): boolean {
  return user.role_name === 'Admin'
}

// ── Require auth middleware helper ─────────────────────────
// Gunakan di Route Handler:
//   const auth = await requireAuth(request)
//   if (!auth.ok) return auth.response
//   const { user, supabase } = auth
export async function requireAuth(request: NextRequest) {
  const auth = await getAuthUser(request)

  if (!auth) {
    return {
      ok: false as const,
      response: unauthorized(),
    }
  }

  return {
    ok: true as const,
    user: auth.user,
    supabase: auth.supabase,
  }
}

// ── Require HR/Admin ───────────────────────────────────────
export async function requireHrOrAdmin(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth

  if (!isHrOrAdmin(auth.user)) {
    const { forbidden } = await import('@/lib/utils/response')
    return {
      ok: false as const,
      response: forbidden(),
    }
  }

  return auth
}

// ── Get client IP ──────────────────────────────────────────
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}
