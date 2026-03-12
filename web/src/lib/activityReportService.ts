import { supabase } from './supabase'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityReportFilters = {
  startDate:     string
  endDate:       string
  departmentId?: string
  search?:       string
  page?:         number
  perPage?:      number
}

export type ActivityRow = {
  id:              string
  attendance_date: string
  employee_name:   string
  employee_code:   string | null
  title:           string
  description:     string
  time:            string
  location:        string
  status_color:    string | null
}

// ─── Fetch rows ───────────────────────────────────────────────────────────────

export async function getActivityReportRows(
  tenantId: string,
  filters:  ActivityReportFilters,
): Promise<{ data: ActivityRow[]; count: number; error: string | null }> {
  const { startDate, endDate, departmentId, page = 1, perPage = 20 } = filters
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = supabase
    .from('attendances')
    .select(`
      id, attendance_date, check_in, check_out,
      check_in_is_valid_location, late_minutes,
      attendance_status ( code, name, color ),
      employees ( id, full_name, employee_code, departments ( name ) )
    `, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .gte('attendance_date', startDate)
    .lte('attendance_date', endDate)
    .order('attendance_date', { ascending: false })
    .order('check_in', { ascending: true, nullsFirst: false })
    .range(from, to)

  if (departmentId) query = query.eq('employees.department_id', departmentId)

  const { data, count, error } = await query
  if (error) return { data: [], count: 0, error: error.message }

  const fmt = (ts: string | null) => {
    if (!ts) return '—'
    try { return format(new Date(ts), 'HH:mm') } catch { return '—' }
  }

  const locLabel = (v: boolean | null) => {
    if (v === true)  return 'Dalam Area'
    if (v === false) return 'Luar Area'
    return 'WFH'
  }

  const rows: ActivityRow[] = (data ?? [])
    .filter((r: any) => {
      const name = r.employees?.full_name?.toLowerCase() ?? ''
      const code = r.employees?.employee_code?.toLowerCase() ?? ''
      const s    = (filters.search ?? '').toLowerCase()
      return !s || name.includes(s) || code.includes(s)
    })
    .map((r: any) => ({
      id:              r.id,
      attendance_date: r.attendance_date,
      employee_name:   r.employees?.full_name   ?? 'Unknown',
      employee_code:   r.employees?.employee_code ?? null,
      title:           r.attendance_status?.name ?? '—',
      description:     r.late_minutes > 0
        ? `Terlambat ${r.late_minutes} menit`
        : r.check_out
          ? 'Hadir tepat waktu'
          : 'Belum check out',
      time:            fmt(r.check_in),
      location:        locLabel(r.check_in_is_valid_location),
      status_color:    r.attendance_status?.color ?? null,
    }))

  return { data: rows, count: count ?? 0, error: null }
}
