import { supabase } from './supabase'
import type { Tables } from '../types/database.types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttendanceFilters = {
  startDate:    string        // 'YYYY-MM-DD'
  endDate:      string        // 'YYYY-MM-DD'
  departmentId?: string
  employeeId?:   string
  page?:         number
  perPage?:      number
}

export type AttendanceRow = Tables<'attendances'> & {
  employees: {
    id:         string
    full_name:  string
    photo_url:  string | null
    employee_code: string | null
    departments: { name: string } | null
    positions:   { name: string } | null
  } | null
  attendance_status: { code: string; name: string; color: string | null } | null
}

export type SummaryStats = {
  total_present:  number
  total_absent:   number
  total_late:     number
  total_early_out: number
  total_wfh:      number
  in_area:        number
  out_of_area:    number
  total_records:  number
}

export type ChartPoint = {
  date:      string   // 'DD'
  hadir:     number
  terlambat: number
  absen:     number
  wfh:       number
}

export type DepartmentOption = { id: string; name: string }
export type EmployeeOption   = { id: string; full_name: string }

// ─── Fetch attendance rows (table) ────────────────────────────────────────────

export async function getAttendanceReport(
  tenantId: string,
  filters: AttendanceFilters
): Promise<{ data: AttendanceRow[]; count: number; error: string | null }> {
  const { startDate, endDate, departmentId, employeeId, page = 1, perPage = 15 } = filters
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = supabase
    .from('attendances')
    .select(`
      *,
      employees!attendances_employee_id_fkey (
        id, full_name, photo_url, employee_code,
        departments ( name ),
        positions   ( name )
      ),
      attendance_status ( code, name, color )
    `, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .gte('attendance_date', startDate)
    .lte('attendance_date', endDate)
    .order('attendance_date', { ascending: false })
    .order('check_in',        { ascending: true,  nullsFirst: false })
    .range(from, to)

  if (employeeId)   query = query.eq('employee_id', employeeId)
  if (departmentId) {
    // Filter via employee join — Supabase supports: employees.department_id=eq.xxx
    query = query.eq('employees.department_id', departmentId)
  }

  const { data, count, error } = await query

  if (error) return { data: [], count: 0, error: error.message }
  return { data: (data ?? []) as AttendanceRow[], count: count ?? 0, error: null }
}

// ─── Stats cards (aggregate for date range) ───────────────────────────────────

export async function getAttendanceStats(
  tenantId: string,
  startDate: string,
  endDate: string,
  departmentId?: string
): Promise<{ data: SummaryStats; error: string | null }> {
  const empty: SummaryStats = {
    total_present: 0, total_absent: 0, total_late: 0, total_early_out: 0,
    total_wfh: 0, in_area: 0, out_of_area: 0, total_records: 0,
  }

  // Fetch all attendance_status codes first
  const { data: statuses } = await supabase
    .from('attendance_status')
    .select('id, code')

  const statusMap: Record<string, string> = {}
  statuses?.forEach(s => { statusMap[s.code] = s.id })

  // Aggregate via RPC if available, otherwise client-side from small result
  let query = supabase
    .from('attendances')
    .select(`
      id,
      late_minutes,
      work_hours,
      check_in_is_valid_location,
      check_out_is_valid_location,
      attendance_status ( code ),
      employees!attendances_employee_id_fkey ( department_id )
    `)
    .eq('tenant_id', tenantId)
    .gte('attendance_date', startDate)
    .lte('attendance_date', endDate)

  if (departmentId) query = query.eq('employees.department_id', departmentId)

  const { data, error } = await query
  if (error) return { data: empty, error: error.message }

  const rows = data ?? []
  const stats: SummaryStats = { ...empty, total_records: rows.length }

  rows.forEach(r => {
    const code = (r.attendance_status as { code: string } | null)?.code ?? ''

    if (['present', 'late', 'early_out'].includes(code)) stats.total_present++
    if (code === 'absent')                                stats.total_absent++
    if (code === 'late' || (r.late_minutes ?? 0) > 0)    stats.total_late++
    if (code === 'early_out')                             stats.total_early_out++
    if (code === 'wfh')                                   stats.total_wfh++
    if (r.check_in_is_valid_location)                     stats.in_area++
    if (r.check_in_is_valid_location === false)           stats.out_of_area++
  })

  return { data: stats, error: null }
}

// ─── Chart data (daily breakdown in date range) ───────────────────────────────

export async function getAttendanceChart(
  tenantId: string,
  startDate: string,
  endDate: string
): Promise<{ data: ChartPoint[]; error: string | null }> {
  const { data, error } = await supabase
    .from('attendances')
    .select(`
      attendance_date,
      late_minutes,
      attendance_status ( code )
    `)
    .eq('tenant_id', tenantId)
    .gte('attendance_date', startDate)
    .lte('attendance_date', endDate)
    .order('attendance_date')

  if (error) return { data: [], error: error.message }

  // Group by date
  const grouped: Record<string, ChartPoint> = {}

  ;(data ?? []).forEach(r => {
    const d   = r.attendance_date
    const code = (r.attendance_status as { code: string } | null)?.code ?? ''

    if (!grouped[d]) {
      grouped[d] = {
        date:      d.slice(8, 10),   // 'DD'
        hadir:     0,
        terlambat: 0,
        absen:     0,
        wfh:       0,
      }
    }

    if (['present', 'late', 'early_out'].includes(code)) grouped[d].hadir++
    if (code === 'late' || (r.late_minutes ?? 0) > 0)    grouped[d].terlambat++
    if (code === 'absent')                                grouped[d].absen++
    if (code === 'wfh')                                   grouped[d].wfh++
  })

  return { data: Object.values(grouped), error: null }
}

// ─── Filter options ───────────────────────────────────────────────────────────

export async function getReportFilterOptions(tenantId: string) {
  const [depResult, empResult] = await Promise.all([
    supabase
      .from('departments')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('employees')
      .select('id, full_name')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('full_name'),
  ])

  return {
    departments: (depResult.data ?? []) as DepartmentOption[],
    employees:   (empResult.data ?? []) as EmployeeOption[],
  }
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

export function exportAttendanceCSV(rows: AttendanceRow[], filename: string) {
  const headers = [
    'Nama', 'Kode', 'Departemen', 'Jabatan',
    'Tanggal', 'Check In', 'Check Out',
    'Status', 'Terlambat (menit)', 'Jam Kerja', 'Lokasi Masuk',
  ]

  const lines = rows.map(r => [
    r.employees?.full_name ?? '',
    r.employees?.employee_code ?? '',
    r.employees?.departments?.name ?? '',
    r.employees?.positions?.name ?? '',
    r.attendance_date,
    r.check_in  ? new Date(r.check_in).toLocaleTimeString('id-ID',  { hour: '2-digit', minute: '2-digit' }) : '',
    r.check_out ? new Date(r.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '',
    r.attendance_status?.name ?? '',
    r.late_minutes ?? 0,
    r.work_hours?.toFixed(1) ?? '',
    r.check_in_is_valid_location ? 'Dalam Area' : 'Luar Area',
  ])

  const csv = [headers, ...lines]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
