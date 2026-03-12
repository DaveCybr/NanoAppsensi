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
import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient, createAdminClient } from '@/lib/supabase/server'
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

    // ── 2. Siapkan response dulu agar cookie bisa di-set
    // createRouteClient butuh response object untuk menulis cookie
    const response = NextResponse.json({ success: true }) // placeholder, akan diganti

    // ── 3. Login via Supabase Auth ─────────────────────
    // Pakai createRouteClient agar session cookie tersimpan ke browser
    const supabase = createRouteClient(request, response)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      if (authError?.message?.includes('Invalid login credentials')) {
        return unauthorized('Email atau password salah.')
      }
      if (authError?.message?.includes('Email not confirmed')) {
        return unauthorized('Email belum diverifikasi. Cek inbox kamu.')
      }
      return unauthorized('Login gagal. Silakan coba lagi.')
    }

    // ── 4. Ambil data user dari public.users ───────────
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
      await supabase.auth.signOut()
      return unauthorized('Akun kamu tidak aktif. Hubungi administrator.')
    }

    // ── 5. Cek akun terkunci ───────────────────────────
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

    // ── 6. Update last_login + reset failed count ──────
    await admin
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        failed_login_count: 0,
        locked_until: null,
      })
      .eq('id', authData.user.id)

    // ── 7. Build AuthUser response ─────────────────────
    const role = (Array.isArray(userData.role) ? userData.role[0] : userData.role) as { name: string } | null
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

    // ── 8. Response berbeda untuk web vs mobile ────────
    if (isMobileClient) {
      // Flutter butuh token eksplisit — tidak butuh cookie
      const session = authData.session
      const mobilePayload: LoginResponse = {
        user: authUser,
        access_token: session?.access_token ?? '',
        refresh_token: session?.refresh_token ?? '',
        expires_at: session?.expires_at ?? 0,
      }
      return ok<LoginResponse>(mobilePayload, 'Login berhasil.')
    }

    // ── 9. Web: kembalikan response yang sudah membawa cookie ──
    // PENTING: kita harus return `response` yang sama yang dipakai
    // createRouteClient, karena cookie sudah di-set ke object ini
    const webResponse = NextResponse.json(
      { success: true, data: { user: authUser }, message: 'Login berhasil.' },
      { status: 200 }
    )

    // Copy semua cookie dari response placeholder ke response final via headers
    // untuk memastikan semua atribut (Path, HttpOnly, dsb) terbawa dengan benar
    const setCookieHeaders = response.headers.getSetCookie()
    setCookieHeaders.forEach(cookie => {
      webResponse.headers.append('Set-Cookie', cookie)
    })

    return webResponse

  } catch (error) {
    return serverError(error)
  }
}