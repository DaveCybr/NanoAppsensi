// app/api/leave/requests/[id]/review/route.ts
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireHrOrAdmin, getClientIp } from '@/lib/utils/auth'
import { ok, badRequest, notFound, serverError } from '@/lib/utils/response'
import { LeaveReviewSchema } from '@/lib/validations/leave'
import { writeAuditLog } from '@/lib/utils/audit'

interface Props {
  params: { id: string }
}

// PATCH /api/leave/requests/:id/review
export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    if (!user.employee_id) return badRequest('Data HR tidak lengkap (employee_id missing).')

    const body = await request.json()
    const parsed = LeaveReviewSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)
    const { action, rejection_note } = parsed.data

    const admin = createAdminClient()
    const { data: leave_req, error: fetchError } = await admin
      .from('leave_requests')
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (fetchError || !leave_req) return notFound('Pengajuan cuti')
    if (leave_req.status !== 'pending') return badRequest('Pengajuan cuti sudah diproses.')

    const year = parseInt(leave_req.start_date.split('-')[0])

    if (action === 'approve') {
      // Re-check balance
      const { data: balance } = await admin
        .from('leave_balances')
        .select('remaining_days')
        .eq('employee_id', leave_req.employee_id)
        .eq('leave_type_id', leave_req.leave_type_id)
        .eq('year', year)
        .single()

      if (!balance || balance.remaining_days < leave_req.total_days) {
        return badRequest('Sisa cuti karyawan tidak mencukupi untuk disetujui.')
      }

      // Update request
      const { error: updateError } = await admin
        .from('leave_requests')
        .update({
          status: 'approved',
          approved_by: user.employee_id,
          approved_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      // Deduct balance via RPC
      const { error: rpcError } = await admin.rpc('decrement_leave_balance', {
        p_employee_id: leave_req.employee_id,
        p_leave_type_id: leave_req.leave_type_id,
        p_year: year,
        p_days: leave_req.total_days
      })

      if (rpcError) throw rpcError
    } else {
      // REJECT
      const { error: updateError } = await admin
        .from('leave_requests')
        .update({
          status: 'rejected',
          approved_by: user.employee_id,
          approved_at: new Date().toISOString(),
          rejection_note
        })
        .eq('id', params.id)

      if (updateError) throw updateError
    }

    const actionText = action === 'approve' ? 'APPROVE' : 'REJECT'
    await writeAuditLog({
      user,
      action: actionText as any,
      entity_type: 'leave_request',
      entity_id: params.id,
      old_value: leave_req,
      ip_address: getClientIp(request)
    })

    return ok(null, `Pengajuan cuti berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}.`)
  } catch (error) {
    return serverError(error)
  }
}
