import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ok, unauthorized, serverError } from '@/lib/utils/response'
import { requireAuth } from '@/lib/utils/auth'
import type { MeResponse } from '@/types/api'

/**
 * GET /api/auth/me
 * Return: user profile + tenant info + permissions
 */
export async function GET(request: NextRequest) {
  try {
    // ── 1. Auth check ──────────────────────────────────
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response

    const { user } = auth
    const admin = createAdminClient()

    // ── 2. Ambil tenant info ───────────────────────────
    const { data: tenant, error: tenantError } = await admin
      .from('tenants')
      .select('id, name, slug, logo_url, timezone, subscription_plan')
      .eq('id', user.tenant_id)
      .single()

    if (tenantError || !tenant) return unauthorized()

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
    if (user.role_name === 'Admin' || user.role_name === 'HR Manager') {
      const { data: allPerms } = await admin
        .from('permissions')
        .select('code')
      permissions = (allPerms ?? []).map((p: any) => p.code)
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

    return ok<MeResponse>(response)

  } catch (error) {
    return serverError(error)
  }
}
