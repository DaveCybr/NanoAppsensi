import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireHrOrAdmin, requireAuth, getClientIp } from '@/lib/utils/auth'
import { ok, badRequest, notFound, serverError, conflict } from '@/lib/utils/response'
import { writeAuditLog } from '@/lib/utils/audit'
import { ShiftSchema } from '@/lib/validations/shift'

type RouteParams = { params: { id: string } }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { user } = auth

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  try {
    const { data: shift, error } = await supabase
      .from('shifts')
      .select(`
        id, name, start_time, end_time, is_overnight, 
        late_tolerance_minutes, break_duration_minutes, created_at
      `)
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    if (!shift) return notFound('Shift')

    // Get assigned employees
    const { data: assignments, error: assignmentError } = await supabase
      .from('employee_shifts' as any)
      .select(`
        id,
        employee_id,
        start_date,
        end_date,
        employees:employee_id (
          id,
          full_name,
          employee_code,
          department:departments (name)
        )
      `)
      .eq('shift_id', params.id)
      .eq('tenant_id', user.tenant_id)
      .or(`end_date.is.null,end_date.gte.${today}`)

    if (assignmentError) throw assignmentError

    const assigned_employees = (assignments || []).map((a: any) => ({
      ...a.employees,
      assignment_id: a.id,
      start_date: a.start_date,
      end_date: a.end_date,
    }))

    return ok({ ...shift, assigned_employees })
  } catch (error) {
    return serverError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireHrOrAdmin(request)
  if (!auth.ok) return auth.response
  const { user } = auth

  try {
    const body = await request.json()
    const validated = ShiftSchema.partial().safeParse(body)

    if (!validated.success) {
      return badRequest(validated.error.errors[0].message)
    }

    const supabase = createAdminClient()

    // Check existence
    const { data: existing, error: checkError } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (checkError) throw checkError
    if (!existing) return notFound('Shift')

    // Check duplicate name if name changed
    if (validated.data.name && validated.data.name !== existing.name) {
      const { data: duplicate, error: duplicateError } = await supabase
        .from('shifts')
        .select('id')
        .eq('tenant_id', user.tenant_id)
        .eq('name', validated.data.name)
        .is('deleted_at', null)
        .maybeSingle()

      if (duplicateError) throw duplicateError
      if (duplicate) return conflict('Nama shift sudah digunakan.')
    }

    const { data: updated, error } = await supabase
      .from('shifts')
      .update(validated.data)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    await writeAuditLog({
      user,
      action: 'UPDATE',
      entity_type: 'shift',
      entity_id: params.id,
      table_name: 'shifts',
      old_value: existing,
      new_value: updated,
      ip_address: getClientIp(request),
    })

    return ok(updated)
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireHrOrAdmin(request)
  if (!auth.ok) return auth.response
  const { user } = auth

  const supabase = createAdminClient()

  try {
    const { data: existing, error: checkError } = await supabase
      .from('shifts')
      .select('id')
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (checkError) throw checkError
    if (!existing) return notFound('Shift')

    const { error } = await supabase
      .from('shifts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) throw error

    await writeAuditLog({
      user,
      action: 'DELETE',
      entity_type: 'shift',
      entity_id: params.id,
      table_name: 'shifts',
      ip_address: getClientIp(request),
    })

    return ok(null, 'Shift berhasil dihapus.')
  } catch (error) {
    return serverError(error)
  }
}
