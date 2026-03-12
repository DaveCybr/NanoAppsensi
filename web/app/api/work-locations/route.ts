import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, requireHrOrAdmin, getClientIp } from '@/lib/utils/auth'
import { writeAuditLog } from '@/lib/utils/audit'
import { ok, created, badRequest, conflict, serverError } from '@/lib/utils/response'
import { z } from 'zod'

const WorkLocationSchema = z.object({
  name:           z.string().min(2).max(255),
  address:        z.string().optional().nullable(),
  latitude:       z.number().min(-90).max(90),
  longitude:      z.number().min(-180).max(180),
  radius_meters:  z.number().min(10).max(5000).default(100),
  is_default:     z.boolean().default(false),
})

// ─────────────────────────────────────────────
// GET /api/work-locations
// Akses: semua user login (untuk dropdown form)
// ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('work_locations' as any)
      .select('id, name, address, latitude, longitude, radius_meters, is_default')
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (error) throw error

    return ok(data ?? [])
  } catch (error) {
    return serverError(error)
  }
}

// ─────────────────────────────────────────────
// POST /api/work-locations
// Akses: HR Manager, Admin
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body tidak valid.')

    const parsed = WorkLocationSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const admin = createAdminClient()

    // Cek nama belum dipakai
    const { data: existing } = await admin
      .from('work_locations' as any)
      .select('id')
      .eq('tenant_id', user.tenant_id)
      .eq('name', parsed.data.name)
      .is('deleted_at', null)
      .single()

    if (existing) return conflict('Nama lokasi kerja sudah ada.')

    // Jika set sebagai default, unset yang lain dulu
    if (parsed.data.is_default) {
      await admin
        .from('work_locations' as any)
        .update({ is_default: false })
        .eq('tenant_id', user.tenant_id)
    }

    const { data, error } = await admin
      .from('work_locations' as any)
      .insert({ ...parsed.data, tenant_id: user.tenant_id })
      .select('id, name, address, latitude, longitude, radius_meters, is_default')
      .single()

    if (error) throw error

    await writeAuditLog({
      user,
      action: 'CREATE',
      entity_type: 'work_location',
      entity_id: data.id,
      table_name: 'work_locations',
      new_value: data,
      ip_address: getClientIp(request),
    })

    return created(data, `Lokasi ${parsed.data.name} berhasil ditambahkan.`)
  } catch (error) {
    return serverError(error)
  }
}