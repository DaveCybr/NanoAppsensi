import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, requireHrOrAdmin, getClientIp } from '@/lib/utils/auth'
import { writeAuditLog } from '@/lib/utils/audit'
import { ok, created, badRequest, conflict, serverError } from '@/lib/utils/response'
import { CreateDepartmentSchema } from '@/lib/validations/department'
import { Department } from '@/types/database'

// ─────────────────────────────────────────────
// GET /api/departments
// Akses: semua user yang login (untuk dropdown form)
// ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('departments')
      .select(`
        id, name, description, created_at
      `)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw error

    // Hitung jumlah karyawan aktif per departemen
    const departmentsWithCount = await Promise.all(
      (data ?? []).map(async (dept: Department) => {
        const { count } = await admin
          .from('employees')
          .select('id', { count: 'exact', head: true })
          .eq('department_id', dept.id)
          .eq('employment_status', 'active')
          .is('deleted_at', null)

        return { ...dept, employee_count: count ?? 0 }
      })
    )

    return ok(departmentsWithCount)
  } catch (error) {
    return serverError(error)
  }
}

// ─────────────────────────────────────────────
// POST /api/departments
// Akses: HR Manager, Admin
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const body   = await request.json().catch(() => null)
    if (!body) return badRequest('Request body tidak valid.')

    const parsed = CreateDepartmentSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const admin = createAdminClient()

    // Cek nama belum dipakai
    const { data: existing } = await admin
      .from('departments')
      .select('id')
      .eq('tenant_id', user.tenant_id)
      .eq('name', parsed.data.name)
      .is('deleted_at', null)
      .single()

    if (existing) return conflict('Nama departemen sudah ada.')

    const { data, error } = await admin
      .from('departments')
      .insert({ ...parsed.data, tenant_id: user.tenant_id })
      .select('id, name, description, created_at')
      .single()

    if (error) throw error

    await writeAuditLog({
      user,
      action: 'CREATE', entity_type: 'department',
      entity_id: data!.id, table_name: 'departments',
      new_value: data,
      ip_address: getClientIp(request),
    })

    return created(data, `Departemen ${parsed.data.name} berhasil dibuat.`)
  } catch (error) {
    return serverError(error)
  }
}
