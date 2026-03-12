import { supabase } from './supabase'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────
export type IssueAttendanceRow = {
  id: string
  type: 'check-in' | 'check-out'
  userName: string
  statusIn: string
  locationIn: 'In-Area' | 'Work From Home' | 'Out of Area'
  time: string
}

export type IssueAttendanceFilters = {
  date?: string        // YYYY-MM-DD
  schedule?: string    // 'All Schedule' | 'Office' | 'WFH'
  search?: string
  page?: number
  perPage?: number
}

// ─── SELECT ───────────────────────────────────────────────────────────────────
export async function getIssueAttendances(
  tenantId: string,
  filters: IssueAttendanceFilters = {}
): Promise<{ data: IssueAttendanceRow[]; count: number; error: string | null }> {
  const { date, search, page = 1, perPage = 10 } = filters
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = supabase
    .from('attendances')
    .select(`
      id,
      check_in,
      check_out,
      check_in_is_valid_location,
      check_out_is_valid_location,
      late_minutes,
      attendance_status ( id, code, name ),
      employees ( id, full_name )
    `, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .or('late_minutes.gt.0,check_in_is_valid_location.eq.false')
    .order('check_in', { ascending: false })
    .range(from, to)

  if (date) {
    query = query.eq('attendance_date', date)
  }

  const { data, count, error } = await query

  if (error) return { data: [], count: 0, error: error.message }

  const rows: IssueAttendanceRow[] = (data ?? []).map((row: any) => {
    // Determine location label
    let locationIn: IssueAttendanceRow['locationIn'] = 'In-Area'
    if (row.check_in_is_valid_location === false) {
      locationIn = 'Out of Area'
    } else if (row.check_in_is_valid_location === null) {
      locationIn = 'Work From Home'
    }

    // Determine status label
    const statusCode = row.attendance_status?.code ?? ''
    let statusIn = row.attendance_status?.name ?? 'Lainnya'
    if (statusCode === 'late')      statusIn = 'Late'
    if (statusCode === 'early_out') statusIn = 'Early Check-Out'
    if (statusCode === 'present')   statusIn = 'On-Time'
    if (statusCode === 'wfh')       statusIn = 'Work From Home'

    // Format time
    let time = '—'
    if (row.check_in) {
      try {
        time = format(new Date(row.check_in), 'HH:mm:ss') + ' WIB'
      } catch {
        time = row.check_in
      }
    }

    return {
      id:         row.id,
      type:       'check-in',
      userName:   row.employees?.full_name ?? 'Unknown',
      statusIn,
      locationIn,
      time,
    }
  })

  return { data: rows, count: count ?? 0, error: null }
}
