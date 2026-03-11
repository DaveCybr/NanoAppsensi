import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireHrOrAdmin } from '@/lib/utils/auth'
import { writeAuditLog } from '@/lib/utils/audit'
import { ok, badRequest, notFound, serverError } from '@/lib/utils/response'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()

    // 1. Validasi body
    const body = await request.json().catch(() => null)
    const { action, rejection_note } = body || {}

    if (action !== 'approve' && action !== 'reject') {
      return badRequest('Action harus "approve" atau "reject".')
    }

    // 2. Get correction
    const { data: correction, error: corrError } = await admin
      .from('attendance_corrections')
      .select('*, tenants(overtime_threshold_hours)')
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (corrError || !correction) return notFound('Koreksi absensi')
    if (correction.status !== 'pending') {
      return badRequest('Koreksi ini sudah diproses sebelumnya.')
    }

    // 3. Get HR employee
    const { data: hrEmployee } = await admin
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!hrEmployee) return badRequest('Data karyawan HR tidak ditemukan.')

    // 4. Update correction status
    const { data: updatedCorrection, error: updateCorrError } = await admin
      .from('attendance_corrections')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: hrEmployee.id,
        reviewed_at: new Date().toISOString(),
        rejection_note: action === 'reject' ? rejection_note : null,
      })
      .eq('id', correction.id)
      .select()
      .single()

    if (updateCorrError) throw updateCorrError

    // 5. JIKA action === 'approve'
    if (action === 'approve') {
      // a. Recalculate work_hours
      let work_hours = null
      let overtime_hours = 0
      
      if (updatedCorrection.after_check_out) {
        const diffMs = new Date(updatedCorrection.after_check_out).getTime() - 
                       new Date(updatedCorrection.after_check_in).getTime()
        work_hours = parseFloat((diffMs / 3600000).toFixed(2))
        
        const threshold = correction.tenants?.overtime_threshold_hours ?? 8
        overtime_hours = parseFloat(Math.max(0, work_hours - threshold).toFixed(2))
      }

      // b. Update attendance record
      const { error: attUpdateError } = await admin
        .from('attendances')
        .update({
          check_in: updatedCorrection.after_check_in,
          check_out: updatedCorrection.after_check_out,
          status_id: updatedCorrection.after_status_id,
          work_hours,
          overtime_hours,
          is_manual: true,
          approved_by: hrEmployee.id,
        })
        .eq('id', updatedCorrection.attendance_id)

      if (attUpdateError) throw attUpdateError

      // c. Refresh materialized view
      await admin.rpc('refresh_attendance_stats')
    }

    // 6. Audit log
    await writeAuditLog({
      user,
      action: action === 'approve' ? 'APPROVE' : 'REJECT',
      entity_type: 'attendance_correction',
      entity_id: correction.id,
      table_name: 'attendance_corrections',
      old_value: correction,
      new_value: updatedCorrection,
    })

    return ok(
      updatedCorrection,
      `Koreksi absensi berhasil di-${action === 'approve' ? 'setujui' : 'tolak'}.`
    )

  } catch (error) {
    console.error('[Correction Review Error]', error)
    return serverError(error)
  }
}
