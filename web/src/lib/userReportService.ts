import { supabase } from './supabase'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserReportFilters = {
  startDate:   string
  endDate:     string
  departmentId?: string
  employeeId?:   string
  page?:         number
  perPage?:      number
}

export type UserReportRow = {
  id:              string
  attendance_date: string
  time_in:         string
  time_out:        string
  reason_in:       string
  reason_out:      string
  location_in:     string
  location_out:    string
  late_minutes:    number
  work_hours:      number
  status_color:    string | null
}

export type UserReportStats = {
  total_late_minutes: number
  total_work_hours:   number
  total_records:      number
}

// ─── Fetch rows ───────────────────────────────────────────────────────────────

export async function getUserReportRows(
  tenantId:  string,
  filters:   UserReportFilters,
): Promise<{ data: UserReportRow[]; count: number; error: string | null }> {
  const { startDate, endDate, employeeId, page = 1, perPage = 15 } = filters
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = supabase
    .from('attendances')
    .select(`
      id, attendance_date, check_in, check_out,
      late_minutes, work_hours,
      check_in_is_valid_location, check_out_is_valid_location,
      attendance_status ( code, name, color )
    `, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .gte('attendance_date', startDate)
    .lte('attendance_date', endDate)
    .order('attendance_date', { ascending: false })

  if (employeeId) query = query.eq('employee_id', employeeId)

  const { data, count, error } = await query.range(from, to)
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

  const rows: UserReportRow[] = (data ?? []).map((r: any) => ({
    id:              r.id,
    attendance_date: r.attendance_date,
    time_in:         fmt(r.check_in),
    time_out:        fmt(r.check_out),
    reason_in:       r.attendance_status?.name ?? '—',
    reason_out:      r.check_out ? (r.attendance_status?.name ?? '—') : '—',
    location_in:     locLabel(r.check_in_is_valid_location),
    location_out:    r.check_out ? locLabel(r.check_out_is_valid_location) : '—',
    late_minutes:    r.late_minutes ?? 0,
    work_hours:      r.work_hours ?? 0,
    status_color:    r.attendance_status?.color ?? null,
  }))

  return { data: rows, count: count ?? 0, error: null }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getUserReportStats(
  tenantId:   string,
  filters:    UserReportFilters,
): Promise<{ data: UserReportStats; error: string | null }> {
  const { startDate, endDate, employeeId } = filters
  const empty: UserReportStats = { total_late_minutes: 0, total_work_hours: 0, total_records: 0 }

  let query = supabase
    .from('attendances')
    .select('late_minutes, work_hours')
    .eq('tenant_id', tenantId)
    .gte('attendance_date', startDate)
    .lte('attendance_date', endDate)

  if (employeeId) query = query.eq('employee_id', employeeId)

  const { data, error } = await query
  if (error) return { data: empty, error: error.message }

  const rows = data ?? []
  const stats: UserReportStats = {
    total_records:      rows.length,
    total_late_minutes: rows.reduce((s, r) => s + (r.late_minutes ?? 0), 0),
    total_work_hours:   rows.reduce((s, r) => s + (r.work_hours   ?? 0), 0),
  }
  return { data: stats, error: null }
}
