import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
export type PositionRow = {
  id: string
  name: string
  tenant_id: string
  created_at: string | null
}

export type GradeRow = {
  id: string
  code: string
  name: string
  tenant_id: string
  created_at: string | null
}

export type EmploymentStatusRow = {
  id: string
  code: string
  name: string
  tenant_id: string
  created_at: string | null
}

// ─── POSITIONS ────────────────────────────────────────────────────────────────
export async function getPositionList(tenantId: string): Promise<{ data: PositionRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('positions')
    .select('id, name, tenant_id, created_at')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  return { data: (data ?? []) as PositionRow[], error: error?.message ?? null }
}

export async function createPosition(tenantId: string, name: string): Promise<{ data: PositionRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('positions')
    .insert({ tenant_id: tenantId, name })
    .select('id, name, tenant_id, created_at')
    .single()

  return { data: data as PositionRow | null, error: error?.message ?? null }
}

export async function updatePosition(id: string, name: string): Promise<{ data: PositionRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('positions')
    .update({ name })
    .eq('id', id)
    .select('id, name, tenant_id, created_at')
    .single()

  return { data: data as PositionRow | null, error: error?.message ?? null }
}

export async function deletePosition(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('positions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  return { error: error?.message ?? null }
}

// ─── GRADES ───────────────────────────────────────────────────────────────────
export async function getGradeList(tenantId: string): Promise<{ data: GradeRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('grades')
    .select('id, code, name, tenant_id, created_at')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  return { data: (data ?? []) as GradeRow[], error: error?.message ?? null }
}

export async function createGrade(tenantId: string, code: string, name: string): Promise<{ data: GradeRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('grades')
    .insert({ tenant_id: tenantId, code, name })
    .select('id, code, name, tenant_id, created_at')
    .single()

  return { data: data as GradeRow | null, error: error?.message ?? null }
}

export async function updateGrade(id: string, code: string, name: string): Promise<{ data: GradeRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('grades')
    .update({ code, name })
    .eq('id', id)
    .select('id, code, name, tenant_id, created_at')
    .single()

  return { data: data as GradeRow | null, error: error?.message ?? null }
}

export async function deleteGrade(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('grades')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  return { error: error?.message ?? null }
}

// ─── EMPLOYMENT STATUSES ──────────────────────────────────────────────────────
export async function getEmploymentStatusList(tenantId: string): Promise<{ data: EmploymentStatusRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('employment_statuses')
    .select('id, code, name, tenant_id, created_at')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  return { data: (data ?? []) as EmploymentStatusRow[], error: error?.message ?? null }
}

export async function createEmploymentStatus(tenantId: string, code: string, name: string): Promise<{ data: EmploymentStatusRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('employment_statuses')
    .insert({ tenant_id: tenantId, code, name })
    .select('id, code, name, tenant_id, created_at')
    .single()

  return { data: data as EmploymentStatusRow | null, error: error?.message ?? null }
}

export async function updateEmploymentStatus(id: string, code: string, name: string): Promise<{ data: EmploymentStatusRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('employment_statuses')
    .update({ code, name })
    .eq('id', id)
    .select('id, code, name, tenant_id, created_at')
    .single()

  return { data: data as EmploymentStatusRow | null, error: error?.message ?? null }
}

export async function deleteEmploymentStatus(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('employment_statuses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  return { error: error?.message ?? null }
}
