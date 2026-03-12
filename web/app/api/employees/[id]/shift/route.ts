import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireHrOrAdmin, getClientIp } from '@/lib/utils/auth'
import { ok, badRequest, notFound, serverError } from '@/lib/utils/response'
import { writeAuditLog } from '@/lib/utils/audit'
import { AssignShiftSchema } from '@/lib/validations/shift'

type RouteParams = { params: { id: string } }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireHrOrAdmin(request)
  if (!auth.ok) return auth.response
  const { user } = auth

  const supabase = createAdminClient()

  try {
    const { data: assignments, error } = await supabase
      .from('employee_shifts' as any)
      .select(`
        id,
        tenant_id,
        employee_id,
        shift_id,
        start_date,
        end_date,
        created_at,
        shifts:shift_id (
          id,
          name,
          start_time,
          end_time,
          is_overnight
        )
      `)
      .eq('employee_id', params.id)
      .eq('tenant_id', user.tenant_id)
      .order('start_date', { ascending: false })

    if (error) throw error

    return ok(assignments)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireHrOrAdmin(request)
  if (!auth.ok) return auth.response
  const { user } = auth

  try {
    const body = await request.json()
    const validated = AssignShiftSchema.safeParse(body)

    if (!validated.success) {
      return badRequest(validated.error.errors[0].message)
    }

    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]
    
    // Calculate yesterday for ending previous assignment
    const todayDate = new Date()
    todayDate.setDate(todayDate.getDate() - 1)
    const yesterday = todayDate.toISOString().split('T')[0]

    // 1. Check employee
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, tenant_id')
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (empError) throw empError
    if (!employee) return notFound('Karyawan')

    // 2. Check shift
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('id, tenant_id')
      .eq('id', validated.data.shift_id)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (shiftError) throw shiftError
    if (!shift) return notFound('Shift')

    // 3. End currently active shift assignments
    const { error: updateError } = await supabase
      .from('employee_shifts' as any)
      .update({ end_date: yesterday })
      .eq('employee_id', params.id)
      .or(`end_date.is.null,end_date.gte.${today}`)

    if (updateError) throw updateError

    // 4. Insert new assignment
    const { data: newAssignment, error: insertError } = await supabase
      .from('employee_shifts' as any)
      .insert({
        tenant_id: user.tenant_id,
        employee_id: params.id,
        shift_id: validated.data.shift_id,
        start_date: validated.data.start_date,
        end_date: validated.data.end_date || null
      })
      .select()
      .single()

    if (insertError) throw insertError

    await writeAuditLog({
      user,
      action: 'UPDATE', // It's updating the employee's shift assignment
      entity_type: 'employee_shift',
      entity_id: newAssignment.id,
      table_name: 'employee_shifts',
      new_value: newAssignment,
      ip_address: getClientIp(request),
    })

    return ok(newAssignment, 'Shift karyawan berhasil diperbarui.')
  } catch (error) {
    return serverError(error)
  }
}
