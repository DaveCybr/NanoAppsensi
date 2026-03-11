// ============================================================
// app/api/auth/login/route.ts
// POST /api/auth/login
//
// Dipakai oleh:
//   - Web admin panel (set cookie session)
//   - Flutter mobile (return JWT token)
//
// Flutter kirim header: X-Client: mobile
// Web tidak perlu header khusus
// ============================================================
import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { LoginSchema } from '@/lib/validations/auth'
import {
  ok, badRequest, unauthorized, serverError,
} from '@/lib/utils/response'
import { getClientIp } from '@/lib/utils/auth'
import type { LoginResponse, AuthUser } from '@/types/api'

export async function POST(request: NextRequest) {
  try {
    // ── 1. Parse & validasi body ───────────────────────
    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body tidak valid.')

    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message)
    }

    const { email, password } = parsed.data
    const isMobileClient = request.headers.get('X-Client') === 'mobile'

    // ── 2. Login via Supabase Auth ─────────────────────
    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      // Supabase error message dalam bahasa Inggris — translate
      if (authError?.message?.includes('Invalid login credentials')) {
        return unauthorized('Email atau password salah.')
      }
      if (authError?.message?.includes('Email not confirmed')) {
        return unauthorized('Email belum diverifikasi. Cek inbox kamu.')
      }
      return unauthorized('Login gagal. Silakan coba lagi.')
    }

    // ── 3. Ambil data user dari public.users ───────────
    const admin = createAdminClient()
    const { data: userData, error: userError } = await admin
      .from('users')
      .select(`
        id, email, full_name, tenant_id, is_active, role_id,
        role:roles(name),
        employee:employees!employees_user_id_fkey(id)
      `)
      .eq('id', authData.user.id)
      .single()

    if (userError || !userData) {
      return serverError(new Error('User profile tidak ditemukan.'))
    }

    if (!userData.is_active) {
      // Logout dulu biar session tidak menggantung
      await supabase.auth.signOut()
      return unauthorized('Akun kamu tidak aktif. Hubungi administrator.')
    }

    // ── 4. Cek akun terkunci ───────────────────────────
    const { data: lockCheck } = await admin
      .from('users')
      .select('locked_until, failed_login_count')
      .eq('id', authData.user.id)
      .single()

    if (lockCheck?.locked_until) {
      const lockedUntil = new Date(lockCheck.locked_until)
      if (lockedUntil > new Date()) {
        await supabase.auth.signOut()
        return unauthorized(
          `Akun dikunci hingga ${lockedUntil.toLocaleString('id-ID')}. Hubungi HR.`
        )
      }
    }

    // ── 5. Update last_login + reset failed count ──────
    await admin
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        failed_login_count: 0,
        locked_until: null,
      })
      .eq('id', authData.user.id)

    // ── 6. Build AuthUser response ─────────────────────
    const role = userData.role as { name: string } | null
    const employee = userData.employee as { id: string }[] | null

    const authUser: AuthUser = {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      tenant_id: userData.tenant_id,
      role_name: role?.name ?? null,
      employee_id: employee?.[0]?.id ?? null,
      is_active: userData.is_active,
    }

    // ── 7. Response berbeda untuk web vs mobile ────────
    if (isMobileClient) {
      // Flutter butuh token eksplisit
      const session = authData.session
      const response: LoginResponse = {
        user: authUser,
        access_token: session?.access_token ?? '',
        refresh_token: session?.refresh_token ?? '',
        expires_at: session?.expires_at ?? 0,
      }
      return ok<LoginResponse>(response, 'Login berhasil.')
    }

    // Web: cookie sudah di-set otomatis oleh Supabase SSR
    // Hanya return user info
    return ok({ user: authUser }, 'Login berhasil.')

  } catch (error) {
    return serverError(error)
  }
}
