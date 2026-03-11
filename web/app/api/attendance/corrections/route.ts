import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, isHrOrAdmin } from '@/lib/utils/auth'
import { writeAuditLog } from '@/lib/utils/audit'
import { created, badRequest, notFound, conflict, forbidden, serverError } from '@/lib/utils/response'
import { CorrectionSchema } from '@/lib/validations/attendance'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()

    // 1. Validasi body
    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body tidak valid.')

    const parsed = CorrectionSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message)
    }

    // 2. Get current employee
    const { data: currentEmployee } = await admin
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!currentEmployee) return badRequest('Data karyawan tidak ditemukan.')

    // 3. Get attendance yang akan dikoreksi
    const { data: attendance, error: attError } = await admin
      .from('attendances')
      .select('id, employee_id, check_in, check_out, status_id')
      .eq('id', parsed.data.attendance_id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (attError || !attendance) return notFound('Data absensi')

    // 4. Validasi kepemilikan
    if (!isHrOrAdmin(user) && attendance.employee_id !== currentEmployee.id) {
      return forbidden('Anda hanya bisa mengajukan koreksi untuk absensi sendiri.')
    }

    // 5. Cek tidak ada correction pending
    const { data: existingPending } = await admin
      .from('attendance_corrections')
      .select('id')
      .eq('attendance_id', attendance.id)
      .eq('status', 'pending')
      .single()

    if (existingPending) {
      return conflict('Sudah ada pengajuan koreksi yang sedang menunggu persetujuan.')
    }

    // 6. Insert attendance_corrections
    const { data: correction, error: insertError } = await admin
      .from('attendance_corrections')
      .insert({
        attendance_id: attendance.id,
        tenant_id: user.tenant_id,
        employee_id: attendance.employee_id,
        before_check_in: attendance.check_in,
        before_check_out: attendance.check_out,
        before_status_id: attendance.status_id,
        after_check_in: parsed.data.after_check_in,
        after_check_out: parsed.data.after_check_out ?? null,
        after_status_id: parsed.data.after_status_id,
        reason: parsed.data.reason,
        status: 'pending',
        requested_by: currentEmployee.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Insert Correction Error]', insertError)
      return serverError('Gagal mengajukan koreksi absensi.')
    }

    // 7. Audit log
    await writeAuditLog({
      user,
      action: 'CREATE',
      entity_type: 'attendance_correction',
      entity_id: correction.id,
      table_name: 'attendance_corrections',
      new_value: correction,
    })

    return created(correction, 'Pengajuan koreksi berhasil dikirim.')

  } catch (error) {
    console.error('[Correction Submit Error]', error)
    return serverError(error)
  }
}
