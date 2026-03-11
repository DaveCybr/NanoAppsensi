// ============================================================
// app/api/auth/logout/route.ts
// POST /api/auth/logout
// ============================================================
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ok, serverError } from '@/lib/utils/response'
import { requireAuth } from '@/lib/utils/auth'

export async function POST(request: NextRequest) {
  try {
    // Optional: cek auth dulu (kalau token sudah expired, tetap lanjut logout)
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      // Tetap return ok — user tetap logout dari sisi client
      console.error('[Logout Error]', error)
    }

    return ok(null, 'Logout berhasil.')
  } catch (error) {
    return serverError(error)
  }
}


// ============================================================
// app/api/auth/me/route.ts
// GET /api/auth/me
// Return: user profile + tenant info + permissions
// ============================================================
// (Simpan file ini di app/api/auth/me/route.ts)

import { NextRequest as NextRequestMe } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  ok as okMe,
  unauthorized as unauthorizedMe,
  serverError as serverErrorMe,
} from '@/lib/utils/response'
import { requireAuth as requireAuthMe } from '@/lib/utils/auth'
import type { MeResponse } from '@/types/api'

export async function GET(request: NextRequestMe) {
  try {
    // ── 1. Auth check ──────────────────────────────────
    const auth = await requireAuthMe(request)
    if (!auth.ok) return auth.response

    const { user } = auth
    const admin = createAdminClient()

    // ── 2. Ambil tenant info ───────────────────────────
    const { data: tenant, error: tenantError } = await admin
      .from('tenants')
      .select('id, name, slug, logo_url, timezone, subscription_plan')
      .eq('id', user.tenant_id)
      .single()

    if (tenantError || !tenant) return unauthorizedMe()

    // ── 3. Ambil permissions dari role ─────────────────
    let permissions: string[] = []

    if (user.role_name) {
      const { data: userWithRole } = await admin
        .from('users')
        .select(`
          role:roles(
            role_permissions(
              permission:permissions(code)
            )
          )
        `)
        .eq('id', user.id)
        .single()

      if (userWithRole?.role) {
        const role = userWithRole.role as any
        permissions = (role?.role_permissions ?? [])
          .map((rp: any) => rp.permission?.code)
          .filter(Boolean) as string[]
      }
    }

    // Admin dan HR Manager mendapat semua permission
    if (user.role_name === 'Admin') {
      const { data: allPerms } = await admin
        .from('permissions')
        .select('code')
      permissions = (allPerms ?? []).map(p => p.code)
    }

    // ── 4. Return response ─────────────────────────────
    const response: MeResponse = {
      user,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo_url: tenant.logo_url,
        timezone: tenant.timezone,
        subscription_plan: tenant.subscription_plan,
      },
      permissions,
    }

    return okMe<MeResponse>(response)

  } catch (error) {
    return serverErrorMe(error)
  }
}
