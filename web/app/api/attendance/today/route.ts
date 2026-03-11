import { NextRequest } from 'next/server'
import { toZonedTime, format } from 'date-fns-tz'
import { createAdminClient } from '@/lib/supabase/server'
import { requireHrOrAdmin } from '@/lib/utils/auth'
import { ok, serverError } from '@/lib/utils/response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()

    // 1. Get tenant timezone
    const { data: tenant } = await admin
      .from('tenants')
      .select('timezone')
      .eq('id', user.tenant_id)
      .single()

    const timezone = tenant?.timezone ?? 'Asia/Jakarta'

    // 2. Hitung today string (YYYY-MM-DD)
    const zonedNow = toZonedTime(new Date(), timezone)
    const today = format(zonedNow, 'yyyy-MM-dd', { timeZone: timezone })

    // 3. Query paralel
    const [empRes, attRes, leaveRes] = await Promise.all([
      // a. Total karyawan aktif
      admin
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', user.tenant_id)
        .eq('employment_status', 'active')
        .is('deleted_at', null),

      // b. Attendance records hari ini
      admin
        .from('attendances')
        .select('id, status:attendance_status(code)')
        .eq('tenant_id', user.tenant_id)
        .eq('attendance_date', today),

      // c. Cuti yang disetujui hari ini
      admin
        .from('leave_requests')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', user.tenant_id)
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today),
    ])

    if (empRes.error) throw empRes.error
    if (attRes.error) throw attRes.error
    if (leaveRes.error) throw leaveRes.error

    const total_employees = empRes.count ?? 0
    const on_leave_today = leaveRes.count ?? 0
    
    const attendances = attRes.data ?? []
    const total_checkedin = attendances.length

    let total_present = 0
    let total_late = 0
    let total_wfh = 0

    attendances.forEach((at: any) => {
      const code = at.status?.code
      if (code === 'PRESENT') total_present++
      else if (code === 'LATE') total_late++
      else if (code === 'WFH') total_wfh++
    })

    const not_yet_checkin = Math.max(0, total_employees - total_checkedin - on_leave_today)

    return ok({
      date: today,
      total_employees,
      total_present,
      total_late,
      total_absent: not_yet_checkin, // Sama dengan not_yet_checkin per instruksi
      total_wfh,
      on_leave_today,
      not_yet_checkin,
    })

  } catch (error) {
    console.error('[Today Summary Error]', error)
    return serverError(error)
  }
}
