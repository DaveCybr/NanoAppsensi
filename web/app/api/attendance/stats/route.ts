import { NextRequest } from 'next/server'
import { toZonedTime, format } from 'date-fns-tz'
import { createAdminClient } from '@/lib/supabase/server'
import { requireHrOrAdmin } from '@/lib/utils/auth'
import { ok, badRequest, serverError } from '@/lib/utils/response'

// GET /api/attendance/stats?days=7
// Returns daily breakdown: hadir, terlambat, absent per hari
export async function GET(request: NextRequest) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const url  = new URL(request.url)
    const days = Math.min(30, Math.max(7, parseInt(url.searchParams.get('days') ?? '7')))

    const admin = createAdminClient()

    // Get tenant timezone
    const { data: tenant } = await admin
      .from('tenants')
      .select('timezone')
      .eq('id', user.tenant_id)
      .single()

    const timezone = tenant?.timezone ?? 'Asia/Jakarta'
    const now      = toZonedTime(new Date(), timezone)

    // Build date range
    const dateRange: string[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      dateRange.push(format(d, 'yyyy-MM-dd', { timeZone: timezone }))
    }

    const startDate = dateRange[0]
    const endDate   = dateRange[dateRange.length - 1]

    // Get all attendance in range
    const { data: attendances, error } = await admin
      .from('attendances')
      .select(`
        attendance_date,
        status:attendance_status(code)
      `)
      .eq('tenant_id', user.tenant_id)
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate)

    if (error) throw error

    // Get total active employees
    const { count: totalEmployees } = await admin
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', user.tenant_id)
      .eq('employment_status', 'active')
      .is('deleted_at', null)

    // Group by date
    const statsMap: Record<string, { hadir: number; terlambat: number; absent: number; wfh: number }> = {}
    dateRange.forEach(d => {
      statsMap[d] = { hadir: 0, terlambat: 0, absent: 0, wfh: 0 }
    })

    attendances?.forEach((att: any) => {
      const d    = att.attendance_date
      const code = att.status?.code
      if (!statsMap[d]) return
      if (code === 'PRESENT')  statsMap[d].hadir++
      else if (code === 'LATE') statsMap[d].terlambat++
      else if (code === 'WFH')  statsMap[d].wfh++
    })

    // absent = total - hadir - terlambat - wfh (per hari)
    const total = totalEmployees ?? 0
    const result = dateRange.map(d => {
      const s      = statsMap[d]
      const checkin = s.hadir + s.terlambat + s.wfh
      const absent  = Math.max(0, total - checkin)
      // Format label: Senin, Sel, etc untuk <= 7 hari; tanggal untuk > 7
      const dateObj = new Date(d + 'T00:00:00')
      const label   = days <= 7
        ? dateObj.toLocaleDateString('id-ID', { weekday: 'short' })
        : dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

      return {
        date:       d,
        name:       label,
        hadir:      s.hadir,
        terlambat:  s.terlambat,
        wfh:        s.wfh,
        absent,
      }
    })

    return ok({
      data: result,
      total_employees: total,
      period: { start: startDate, end: endDate, days },
    })
  } catch (error) {
    return serverError(error)
  }
}