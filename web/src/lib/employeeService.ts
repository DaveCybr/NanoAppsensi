import { supabase } from '../lib/supabase'
import type { EmployeeWithRelations, InsertDto, UpdateDto } from '../types/database.types'

// ─── Types ────────────────────────────────────────────────────────────────────
export type EmployeeFilters = {
  search?:    string
  departmentId?: string
  positionId?:   string
  isActive?:  boolean
  page?:      number
  perPage?:   number
}

export type EmployeeListResult = {
  data:  EmployeeWithRelations[]
  count: number
  error: string | null
}

export type EmployeeFormData = {
  // Personal
  full_name:         string
  employee_code:     string
  birth_date:        string
  gender:            string
  marital_status:    string
  national_id:       string
  phone:             string
  address:           string
  // Employment
  department_id:     string
  position_id:       string
  work_location_id:  string
  employment_status: string
  hire_date:         string
  manager_id:        string
  // Account
  email:             string
  password:          string
}

// ─── SELECT ───────────────────────────────────────────────────────────────────
export async function getEmployees(filters: EmployeeFilters = {}): Promise<EmployeeListResult> {
  const { search, departmentId, positionId, isActive, page = 1, perPage = 10 } = filters
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = supabase
    .from('employees')
    .select(`
      *,
      departments ( id, name ),
      positions   ( id, name ),
      work_locations ( id, name ),
      users       ( id, email, is_active )
    `, { count: 'exact' })
    .is('deleted_at', null)
    .order('full_name', { ascending: true })
    .range(from, to)

  if (search?.trim()) {
    query = query.or(
      `full_name.ilike.%${search}%,employee_code.ilike.%${search}%`
    )
  }
  if (departmentId) query = query.eq('department_id', departmentId)
  if (positionId)   query = query.eq('position_id',   positionId)

  // Filter by user.is_active via the join — post-filter in JS (simpler than RPC)
  const { data, count, error } = await query

  if (error) return { data: [], count: 0, error: error.message }

  let result = (data ?? []) as EmployeeWithRelations[]
  if (isActive !== undefined) {
    result = result.filter(e => (e.users?.is_active ?? false) === isActive)
  }

  return { data: result, count: count ?? 0, error: null }
}

export async function getEmployeeById(id: string): Promise<{ data: EmployeeWithRelations | null; error: string | null }> {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      departments ( id, name ),
      positions   ( id, name ),
      work_locations ( id, name ),
      users       ( id, email, is_active )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as EmployeeWithRelations, error: null }
}

// ─── INSERT ───────────────────────────────────────────────────────────────────
/**
 * Creates employee record + optional Supabase Auth account.
 * If email+password provided → creates auth user first, then employee row.
 */
export async function createEmployee(
  form: EmployeeFormData,
  tenantId: string
): Promise<{ data: EmployeeWithRelations | null; error: string | null }> {
  let userId: string | null = null

  // 1. Create auth account if credentials provided
  if (form.email && form.password) {
    const { data: authData, error: authError } = await supabase.auth.admin
      ? // If running as service role (server-side)
        { data: null, error: new Error('Use server-side creation for auth users') }
      : // Client-side: use signUp (user gets email confirmation)
        await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.full_name, tenant_id: tenantId },
          },
        })

    if (authError) return { data: null, error: `Auth: ${authError.message}` }
    userId = authData?.user?.id ?? null
  }

  // 2. Build employee insert payload
  const payload: InsertDto<'employees'> = {
    tenant_id:         tenantId,
    user_id:           userId,
    full_name:         form.full_name,
    employee_code:     form.employee_code || null,
    birth_date:        form.birth_date    || null,
    gender:            form.gender        || null,
    marital_status:    form.marital_status || null,
    national_id:       form.national_id   || null,
    phone:             form.phone         || null,
    address:           form.address       || null,
    department_id:     form.department_id || null,
    position_id:       form.position_id   || null,
    work_location_id:  form.work_location_id || null,
    employment_status: form.employment_status || null,
    hire_date:         form.hire_date     || null,
    manager_id:        form.manager_id    || null,
  }

  const { data, error } = await supabase
    .from('employees')
    .insert(payload)
    .select(`
      *,
      departments ( id, name ),
      positions   ( id, name ),
      work_locations ( id, name ),
      users       ( id, email, is_active )
    `)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as EmployeeWithRelations, error: null }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export async function updateEmployee(
  id: string,
  updates: Partial<EmployeeFormData>
): Promise<{ data: EmployeeWithRelations | null; error: string | null }> {
  const payload: UpdateDto<'employees'> = {
    full_name:         updates.full_name,
    employee_code:     updates.employee_code     || null,
    birth_date:        updates.birth_date         || null,
    gender:            updates.gender             || null,
    marital_status:    updates.marital_status     || null,
    national_id:       updates.national_id        || null,
    phone:             updates.phone              || null,
    address:           updates.address            || null,
    department_id:     updates.department_id      || null,
    position_id:       updates.position_id        || null,
    work_location_id:  updates.work_location_id   || null,
    employment_status: updates.employment_status  || null,
    hire_date:         updates.hire_date           || null,
    manager_id:        updates.manager_id          || null,
    updated_at:        new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('employees')
    .update(payload)
    .eq('id', id)
    .select(`
      *,
      departments ( id, name ),
      positions   ( id, name ),
      work_locations ( id, name ),
      users       ( id, email, is_active )
    `)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as EmployeeWithRelations, error: null }
}

// ─── SOFT DELETE ──────────────────────────────────────────────────────────────
export async function deleteEmployee(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('employees')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  return { error: error?.message ?? null }
}

// ─── TOGGLE ACTIVE (via users table) ─────────────────────────────────────────
export async function toggleEmployeeActive(
  userId: string,
  isActive: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', userId)

  return { error: error?.message ?? null }
}

// ─── SUPPORTING DATA ──────────────────────────────────────────────────────────
export async function getDepartments(tenantId: string) {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('name')
  return { data: data ?? [], error: error?.message ?? null }
}

export async function getPositions(tenantId: string) {
  const { data, error } = await supabase
    .from('positions')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('name')
  return { data: data ?? [], error: error?.message ?? null }
}

export async function getWorkLocations(tenantId: string) {
  const { data, error } = await supabase
    .from('work_locations')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('name')
  return { data: data ?? [], error: error?.message ?? null }
}

export async function getManagers(tenantId: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('full_name')
  return { data: data ?? [], error: error?.message ?? null }
}
