import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, requireHrOrAdmin, getClientIp } from '@/lib/utils/auth'
import { writeAuditLog } from '@/lib/utils/audit'
import { ok, created, badRequest, conflict, serverError } from '@/lib/utils/response'
import { CreatePositionSchema } from '@/lib/validations/position'
import { Position } from '@/types/database'

// ─────────────────────────────────────────────
// GET /api/positions
// Akses: semua user yang login (untuk dropdown form)
// ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('positions')
      .select('id, name, description, created_at')
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw error

    // Hitung jumlah karyawan aktif per jabatan
    const positionsWithCount = await Promise.all(
      (data ?? []).map(async (pos: Position) => {
        const { count } = await admin
          .from('employees')
          .select('id', { count: 'exact', head: true })
          .eq('position_id', pos.id)
          .eq('employment_status', 'active')
          .is('deleted_at', null)

        return { ...pos, employee_count: count ?? 0 }
      })
    )

    return ok(positionsWithCount)
  } catch (error) {
    return serverError(error)
  }
}

// ─────────────────────────────────────────────
// POST /api/positions
// Akses: HR Manager, Admin
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const body   = await request.json().catch(() => null)
    if (!body) return badRequest('Request body tidak valid.')

    const parsed = CreatePositionSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const admin = createAdminClient()

    // Cek nama belum dipakai
    const { data: existing } = await admin
      .from('positions')
      .select('id')
      .eq('tenant_id', user.tenant_id)
      .eq('name', parsed.data.name)
      .is('deleted_at', null)
      .single()

    if (existing) return conflict('Nama jabatan sudah ada.')

    const { data, error } = await admin
      .from('positions')
      .insert({ ...parsed.data, tenant_id: user.tenant_id })
      .select('id, name, description, created_at')
      .single()

    if (error) throw error

    await writeAuditLog({
      user,
      action: 'CREATE', entity_type: 'position',
      entity_id: data!.id, table_name: 'positions',
      new_value: data,
      ip_address: getClientIp(request),
    })

    return created(data, `Jabatan ${parsed.data.name} berhasil dibuat.`)
  } catch (error) {
    return serverError(error)
  }
}
