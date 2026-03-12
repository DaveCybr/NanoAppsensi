import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireHrOrAdmin, getClientIp } from '@/lib/utils/auth'
import { writeAuditLog } from '@/lib/utils/audit'
import { ok, badRequest, serverError } from '@/lib/utils/response'
import { z } from 'zod'

const UpdateTenantSchema = z.object({
  name:                       z.string().min(2).max(255).optional(),
  timezone:                   z.string().min(2).max(100).optional(),
  locale:                     z.string().min(2).max(10).optional(),
  checkin_radius_meters:      z.number().min(10).max(5000).optional(),
  face_confidence_threshold:  z.number().min(0).max(100).optional(),
  work_hours_per_day:         z.number().min(1).max(24).optional(),
  overtime_threshold_hours:   z.number().min(1).max(24).optional(),
  logo_url:                   z.string().url().nullable().optional(),
})

// GET /api/settings
export async function GET(request: NextRequest) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('tenants')
      .select('id, name, slug, logo_url, timezone, locale, checkin_radius_meters, face_confidence_threshold, work_hours_per_day, overtime_threshold_hours, subscription_plan, subscription_status')
      .eq('id', user.tenant_id)
      .single()

    if (error) throw error

    return ok(data)
  } catch (error) {
    return serverError(error)
  }
}

// PATCH /api/settings
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body tidak valid.')

    const parsed = UpdateTenantSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const admin = createAdminClient()

    // Get current for audit
    const { data: current } = await admin
      .from('tenants')
      .select('*')
      .eq('id', user.tenant_id)
      .single()

    const { data, error } = await admin
      .from('tenants')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', user.tenant_id)
      .select('id, name, slug, logo_url, timezone, locale, checkin_radius_meters, face_confidence_threshold, work_hours_per_day, overtime_threshold_hours')
      .single()

    if (error) throw error

    await writeAuditLog({
      user,
      action: 'UPDATE',
      entity_type: 'tenant',
      entity_id: user.tenant_id,
      table_name: 'tenants',
      old_value: current,
      new_value: data,
      ip_address: getClientIp(request),
    })

    return ok(data, 'Pengaturan perusahaan berhasil diperbarui.')
  } catch (error) {
    return serverError(error)
  }
}
