import { supabase } from './supabase'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────
export type LeaveRow = {
  id: string
  employee_id: string
  employeeName: string
  leave_type: string
  start_date: string
  end_date: string
  duration: number   // in days, computed
  reason: string | null
  status: 'pending' | 'approved' | 'rejected' | string
  created_at: string | null
}

export type LeaveFilters = {
  status?: 'pending' | 'approved' | 'rejected' | 'all'
  search?: string
  page?: number
  perPage?: number
}

// ─── SELECT ───────────────────────────────────────────────────────────────────
export async function getLeaveRequests(
  tenantId: string,
  filters: LeaveFilters = {}
): Promise<{ data: LeaveRow[]; count: number; error: string | null }> {
  const { status = 'all', search, page = 1, perPage = 10 } = filters
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = supabase
    .from('leave_requests')
    .select(`
      id,
      employee_id,
      leave_type,
      start_date,
      end_date,
      reason,
      status,
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

  const rows: LeaveRow[] = (data ?? []).map((row: any) => {
    const start = new Date(row.start_date)
    const end   = new Date(row.end_date)
    const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1)

    return {
      id:           row.id,
      employee_id:  row.employee_id,
      employeeName: row.employees?.full_name ?? 'Unknown',
      leave_type:   row.leave_type ?? '—',
      start_date:   row.start_date ? format(new Date(row.start_date), 'dd MMM yyyy') : '—',
      end_date:     row.end_date   ? format(new Date(row.end_date),   'dd MMM yyyy') : '—',
      duration,
      reason:       row.reason,
      status:       row.status ?? 'pending',
      created_at:   row.created_at,
    }
  })

  return { data: rows, count: count ?? 0, error: null }
}

// ─── APPROVE / REJECT ─────────────────────────────────────────────────────────
export async function approveLeave(id: string, approvedBy: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('leave_requests')
    .update({ status: 'approved', approved_by: approvedBy, updated_at: new Date().toISOString() })
    .eq('id', id)

  return { error: error?.message ?? null }
}

export async function rejectLeave(id: string, reason?: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('leave_requests')
    .update({
      status:     'rejected',
      updated_at: new Date().toISOString(),
      ...(reason ? { rejection_reason: reason } : {}),
    })
    .eq('id', id)

  return { error: error?.message ?? null }
}
