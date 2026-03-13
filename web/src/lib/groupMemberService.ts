// web/src/lib/groupMemberService.ts

import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MemberRow = {
  id: string
  full_name: string
  employee_code: string | null
  department_name: string
  position_name: string
}

export type AvailableEmployee = {
  id: string
  full_name: string
  employee_code: string | null
  department_name: string
  current_group_name: string | null
}

export type MemberFilters = {
  search?: string
  page?: number
  perPage?: number
}

// ─── Get members of a group ───────────────────────────────────────────────────

export async function getGroupMembers(
  tenantId: string,
  groupId: string,
  filters: MemberFilters = {},
): Promise<{ data: MemberRow[]; count: number; error: string | null }> {
  const { search, page = 1, perPage = 10 } = filters
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('employees')
    .select(
      `id, full_name, employee_code,
       departments ( name ),
       positions ( name )`,
      { count: 'exact' },
    )
    .eq('tenant_id', tenantId)
    .eq('group_id', groupId)
    .is('deleted_at', null)
    .order('full_name')
    .range(from, to)

  if (search?.trim()) {
    query = query.or(`full_name.ilike.%${search}%,employee_code.ilike.%${search}%`)
  }

  const { data, count, error } = await query
  if (error) return { data: [], count: 0, error: error.message }

  const rows: MemberRow[] = (data ?? []).map((r: any) => ({
    id: r.id,
    full_name: r.full_name,
    employee_code: r.employee_code ?? null,
    department_name: r.departments?.name ?? '—',
    position_name: r.positions?.name ?? '—',
  }))

  return { data: rows, count: count ?? 0, error: null }
}

// ─── Get employees not in this group ─────────────────────────────────────────

export async function getAvailableEmployees(
  tenantId: string,
  groupId: string,
  filters: MemberFilters = {},
): Promise<{ data: AvailableEmployee[]; count: number; error: string | null }> {
  const { search, page = 1, perPage = 10 } = filters
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  // group_id IS NULL OR group_id != groupId
  // (neq alone excludes NULLs in PostgreSQL, so we need the OR)
  let query = supabase
    .from('employees')
    .select(
      `id, full_name, employee_code,
       departments ( name ),
       groups ( name )`,
      { count: 'exact' },
    )
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .or(`group_id.is.null,group_id.neq.${groupId}`)
    .order('full_name')
    .range(from, to)

  if (search?.trim()) {
    query = query.or(`full_name.ilike.%${search}%,employee_code.ilike.%${search}%`)
  }

  const { data, count, error } = await query
  if (error) return { data: [], count: 0, error: error.message }

  const rows: AvailableEmployee[] = (data ?? []).map((r: any) => ({
    id: r.id,
    full_name: r.full_name,
    employee_code: r.employee_code ?? null,
    department_name: r.departments?.name ?? '—',
    current_group_name: r.groups?.name ?? null,
  }))

  return { data: rows, count: count ?? 0, error: null }
}

// ─── Assign employees to a group ──────────────────────────────────────────────

export async function assignMembers(
  employeeIds: string[],
  groupId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('employees')
    .update({ group_id: groupId })
    .in('id', employeeIds)

  return { error: error?.message ?? null }
}

// ─── Remove a member from a group ─────────────────────────────────────────────

export async function removeMember(
  employeeId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('employees')
    .update({ group_id: null })
    .eq('id', employeeId)

  return { error: error?.message ?? null }
}
