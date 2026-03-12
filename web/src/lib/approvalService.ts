import { supabase } from './supabase'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────
export type CorrectionRow = {
  id: string
  attendance_id: string
  employee_id: string
  employeeName: string
  reason: string
  status: 'pending' | 'approved' | 'rejected' | string
  before_check_in: string | null
  after_check_in: string | null
  before_check_out: string | null
  after_check_out: string | null
  created_at: string | null
}

export type ApprovalFilters = {
  status?: 'pending' | 'approved' | 'rejected' | 'all'
  search?: string
  page?: number
  perPage?: number
}

// ─── SELECT ───────────────────────────────────────────────────────────────────
export async function getCorrectionRequests(
  tenantId: string,
  filters: ApprovalFilters = {}
): Promise<{ data: CorrectionRow[]; count: number; error: string | null }> {
  const { status = 'all', search, page = 1, perPage = 10 } = filters
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = supabase
    .from('attendance_corrections')
    .select(`
      id,
      attendance_id,
      employee_id,
      reason,
      status,
      before_check_in,
      after_check_in,
      before_check_out,
      after_check_out,
      created_at,
      employees ( id, full_name )
    `, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, count, error } = await query
  if (error) return { data: [], count: 0, error: error.message }

  const formatTime = (ts: string | null) => {
    if (!ts) return '—'
    try { return format(new Date(ts), 'HH:mm') } catch { return ts }
  }

  const rows: CorrectionRow[] = (data ?? []).map((row: any) => ({
    id:              row.id,
    attendance_id:   row.attendance_id,
    employee_id:     row.employee_id,
    employeeName:    row.employees?.full_name ?? 'Unknown',
    reason:          row.reason ?? '—',
    status:          row.status ?? 'pending',
    before_check_in:  formatTime(row.before_check_in),
    after_check_in:   formatTime(row.after_check_in),
    before_check_out: formatTime(row.before_check_out),
    after_check_out:  formatTime(row.after_check_out),
    created_at:       row.created_at,
  }))

  return { data: rows, count: count ?? 0, error: null }
}

// ─── APPROVE / REJECT ─────────────────────────────────────────────────────────
export async function approveCorrection(id: string, reviewedBy: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('attendance_corrections')
    .update({
      status:      'approved',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  return { error: error?.message ?? null }
}

export async function rejectCorrection(id: string, reviewedBy: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('attendance_corrections')
    .update({
      status:      'rejected',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  return { error: error?.message ?? null }
}
