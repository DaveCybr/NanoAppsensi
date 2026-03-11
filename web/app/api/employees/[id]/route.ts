// ============================================================
// app/api/employees/[id]/route.ts
// GET    /api/employees/:id  — detail employee
// PATCH  /api/employees/:id  — update employee
// DELETE /api/employees/:id  — soft delete employee
// ============================================================
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireHrOrAdmin, getClientIp } from '@/lib/utils/auth'
import { writeAuditLog } from '@/lib/utils/audit'
import {
  ok, badRequest, notFound, serverError, noContent,
} from '@/lib/utils/response'
import { UpdateEmployeeSchema } from '@/lib/validations/employee'

type RouteContext = { params: { id: string } }

// ─────────────────────────────────────────────
// GET /api/employees/:id
// ─────────────────────────────────────────────
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('employees')
      .select(`
        id, employee_code, full_name, phone,
        hire_date, employment_status, photo_url,
        face_image_url, birth_date, gender,
        marital_status, national_id, address,
        created_at, updated_at,
        department:departments(id, name),
        position:positions(id, name),
        work_location:work_locations(id, name, address),
        manager:employees!employees_manager_id_fkey(id, full_name, employee_code),
        user:users!employees_user_id_fkey(id, email, last_login, is_active)
      `)
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .single()

    if (error || !data) return notFound('Karyawan')

    // Flatten email ke level atas
    const employee = {
      ...data,
      email:      (data.user as any)?.email ?? null,
      last_login: (data.user as any)?.last_login ?? null,
      is_active:  (data.user as any)?.is_active ?? null,
      user:       undefined,
    }

    return ok(employee)
  } catch (error) {
    return serverError(error)
  }
}

// ─────────────────────────────────────────────
// PATCH /api/employees/:id
// ─────────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const body   = await request.json().catch(() => null)
    if (!body) return badRequest('Request body tidak valid.')

    const parsed = UpdateEmployeeSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const admin = createAdminClient()

    // Ambil data lama untuk audit log
    const { data: before, error: fetchError } = await admin
      .from('employees')
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !before) return notFound('Karyawan')

    // Update
    const { data: updated, error: updateError } = await admin
      .from('employees')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .select(`
        id, employee_code, full_name, phone,
        hire_date, employment_status, photo_url,
        department:departments(id, name),
        position:positions(id, name)
      `)
      .single()

    if (updateError) throw updateError

    // Audit log
    await writeAuditLog({
      user,
      action:      'UPDATE',
      entity_type: 'employee',
      entity_id:   params.id,
      table_name:  'employees',
      old_value:   before,
      new_value:   parsed.data,
      ip_address:  getClientIp(request),
      user_agent:  request.headers.get('user-agent') ?? undefined,
    })

    return ok(updated, 'Data karyawan berhasil diperbarui.')
  } catch (error) {
    return serverError(error)
  }
}

// ─────────────────────────────────────────────
// DELETE /api/employees/:id  — soft delete
// Tidak menghapus akun Supabase Auth,
// hanya set deleted_at + nonaktifkan user
// ─────────────────────────────────────────────
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()

    // Cek employee ada dan milik tenant ini
    const { data: employee, error: fetchError } = await admin
      .from('employees')
      .select('id, full_name, user_id')
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !employee) return notFound('Karyawan')

    // Cegah hapus diri sendiri
    if (employee.user_id === user.id) {
      return badRequest('Tidak dapat menonaktifkan akun sendiri.')
    }

    const now = new Date().toISOString()

    // Soft delete employee
    await admin
      .from('employees')
      .update({ deleted_at: now, employment_status: 'inactive' })
      .eq('id', params.id)

    // Nonaktifkan user login
    if (employee.user_id) {
      await admin
        .from('users')
        .update({ is_active: false })
        .eq('id', employee.user_id)
    }

    // Audit log
    await writeAuditLog({
      user,
      action:      'DELETE',
      entity_type: 'employee',
      entity_id:   params.id,
      table_name:  'employees',
      old_value:   { id: employee.id, full_name: employee.full_name },
      ip_address:  getClientIp(request),
      user_agent:  request.headers.get('user-agent') ?? undefined,
    })

    return ok(null, `Karyawan ${employee.full_name} berhasil dinonaktifkan.`)
  } catch (error) {
    return serverError(error)
  }
}
