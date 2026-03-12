// app/api/leave/requests/[id]/route.ts
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, isHrOrAdmin, getClientIp } from '@/lib/utils/auth'
import { ok, badRequest, notFound, serverError } from '@/lib/utils/response'
import { writeAuditLog } from '@/lib/utils/audit'

interface Props {
  params: { id: string }
}

// GET /api/leave/requests/:id
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('leave_requests')
      .select(`
        *,
        leave_type:leave_types(id, name, is_paid),
        employee:employees!leave_requests_employee_id_fkey(id, full_name, employee_code, department:departments(name)),
        approver:employees!leave_requests_approved_by_fkey(id, full_name)
      `)
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (error || !data) return notFound('Pengajuan cuti')

    // Access control
    if (!isHrOrAdmin(user) && data.employee_id !== user.employee_id) {
      const { forbidden } = await import('@/lib/utils/response')
      return forbidden()
    }

    return ok(data)
  } catch (error) {
    return serverError(error)
  }
}

// DELETE /api/leave/requests/:id (Cancel)
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()
    const { data: request_data, error: fetchError } = await admin
      .from('leave_requests')
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (fetchError || !request_data) return notFound('Pengajuan cuti')

    // Checks
    if (!isHrOrAdmin(user) && request_data.employee_id !== user.employee_id) {
      const { forbidden } = await import('@/lib/utils/response')
      return forbidden()
    }
    if (request_data.status !== 'pending') {
      return badRequest('Hanya pengajuan cuti dengan status "pending" yang dapat dibatalkan.')
    }

    const { data, error } = await admin
      .from('leave_requests')
      .update({ status: 'cancelled' })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    await writeAuditLog({
      user,
      action: 'DELETE',
      entity_type: 'leave_request',
      entity_id: params.id,
      old_value: request_data,
      new_value: data,
      ip_address: getClientIp(request)
    })

    return ok(null, 'Pengajuan cuti berhasil dibatalkan.')
  } catch (error) {
    return serverError(error)
  }
}
