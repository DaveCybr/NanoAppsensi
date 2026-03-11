// ============================================================
// app/api/employees/route.ts
// GET  /api/employees  — list dengan filter, search, pagination
// POST /api/employees  — create employee + buat akun Supabase Auth
// ============================================================
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireHrOrAdmin, getClientIp } from '@/lib/utils/auth'
import { writeAuditLog } from '@/lib/utils/audit'
import {
  ok, created, badRequest, conflict, serverError,
  okWithPagination, buildPaginationMeta,
} from '@/lib/utils/response'
import {
  CreateEmployeeSchema,
  EmployeeQuerySchema,
} from '@/lib/validations/employee'
import { parseQueryParams } from '@/lib/validations/auth'

// ─────────────────────────────────────────────
// GET /api/employees
// Akses: HR Manager, Admin
// Query: page, limit, search, department_id, position_id, employment_status
// ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    // Parse & validasi query params
    const rawQuery = parseQueryParams(new URL(request.url).searchParams)
    const query    = EmployeeQuerySchema.safeParse(rawQuery)
    if (!query.success) return badRequest(query.error.errors[0].message)

    const { page, limit, search, department_id, position_id,
            employment_status, sort_by, sort_dir } = query.data
    const offset = (page - 1) * limit

    const admin = createAdminClient()

    // Build query — join ke users untuk email
    let q = admin
      .from('employees')
      .select(`
        id,
        employee_code,
        full_name,
        phone,
        hire_date,
        employment_status,
        photo_url,
        created_at,
        department:departments(id, name),
        position:positions(id, name),
        work_location:work_locations(id, name),
        user:users!employees_user_id_fkey(email)
      `, { count: 'exact' })
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .order(sort_by, { ascending: sort_dir === 'asc' })
      .range(offset, offset + limit - 1)

    // Filters
    if (search) {
      q = q.or(`full_name.ilike.%${search}%,employee_code.ilike.%${search}%`)
    }
    if (department_id)     q = q.eq('department_id', department_id)
    if (position_id)       q = q.eq('position_id', position_id)
    if (employment_status) q = q.eq('employment_status', employment_status)

    const { data, count, error } = await q
    if (error) throw error

    // Flatten user.email ke level atas
    const employees = (data ?? []).map((emp: any) => ({
      ...emp,
      email: emp.user?.email ?? null,
      user: undefined,
    }))

    return okWithPagination(
      employees,
      buildPaginationMeta(count ?? 0, page, limit)
    )
  } catch (error) {
    return serverError(error)
  }
}

// ─────────────────────────────────────────────
// POST /api/employees
// Akses: HR Manager, Admin
// Flow:
//   1. Validasi input
//   2. Cek email belum terdaftar
//   3. Buat akun di Supabase Auth
//   4. Insert ke public.users (via trigger otomatis)
//   5. Insert ke public.employees
//   6. Audit log
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    // Parse body
    const body   = await request.json().catch(() => null)
    if (!body) return badRequest('Request body tidak valid.')

    const parsed = CreateEmployeeSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const {
      email, password,
      employee_code, full_name, phone,
      department_id, position_id, manager_id, work_location_id,
      hire_date, employment_status,
      birth_date, gender, marital_status, national_id, address,
    } = parsed.data

    const admin = createAdminClient()

    // ── 1. Cek email belum dipakai di tenant ini ───────
    const { data: existingUser } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (existingUser) {
      return conflict('Email sudah terdaftar di perusahaan ini.')
    }

    // ── 2. Generate employee_code jika tidak diisi ─────
    let finalCode = employee_code
    if (!finalCode) {
      const { count } = await admin
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', user.tenant_id)
      finalCode = `EMP-${String((count ?? 0) + 1).padStart(3, '0')}`
    }

    // ── 3. Buat akun Supabase Auth ─────────────────────
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password:      password ?? generateTempPassword(),
      email_confirm: true,   // langsung aktif, tidak perlu verifikasi
      user_metadata: {
        tenant_id: user.tenant_id,
        role_id:   await getDefaultEmployeeRoleId(admin, user.tenant_id),
        full_name,
      },
    })

    if (authError || !authData.user) {
      if (authError?.message?.includes('already been registered')) {
        return conflict('Email sudah terdaftar di sistem.')
      }
      throw authError ?? new Error('Gagal membuat akun.')
    }

    // ── 4. Update public.users (trigger sudah insert, kita update role) ──
    // Trigger handle_new_user sudah auto-insert, tapi role_id perlu dikonfirmasi
    await admin
      .from('users')
      .update({ full_name })
      .eq('id', authData.user.id)

    // ── 5. Insert employee ─────────────────────────────
    const { data: employee, error: empError } = await admin
      .from('employees')
      .insert({
        tenant_id: user.tenant_id,
        user_id:   authData.user.id,
        employee_code: finalCode,
        full_name,
        phone:             phone ?? null,
        department_id:     department_id ?? null,
        position_id:       position_id ?? null,
        manager_id:        manager_id ?? null,
        work_location_id:  work_location_id ?? null,
        hire_date:         hire_date ?? null,
        employment_status: employment_status ?? 'active',
        birth_date:        birth_date ?? null,
        gender:            gender ?? null,
        marital_status:    marital_status ?? null,
        national_id:       national_id ?? null,
        address:           address ?? null,
      })
      .select(`
        id, employee_code, full_name, phone, hire_date, employment_status,
        department:departments(id, name),
        position:positions(id, name)
      `)
      .single()

    if (empError) {
      // Rollback: hapus auth user yang sudah dibuat
      await admin.auth.admin.deleteUser(authData.user.id)
      throw empError
    }

    // ── 6. Audit log ───────────────────────────────────
    await writeAuditLog({
      user,
      action:      'CREATE',
      entity_type: 'employee',
      entity_id:   employee!.id,
      table_name:  'employees',
      new_value:   { ...employee, email },
      ip_address:  getClientIp(request),
      user_agent:  request.headers.get('user-agent') ?? undefined,
    })

    return created(
      { ...employee, email },
      `Karyawan ${full_name} berhasil ditambahkan.`
    )
  } catch (error) {
    return serverError(error)
  }
}

// ── Helpers ────────────────────────────────────────────────

function generateTempPassword(): string {
  return Math.random().toString(36).slice(-8) + 'Aa1!'
}

async function getDefaultEmployeeRoleId(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string
): Promise<string | null> {
  const { data } = await admin
    .from('roles')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('name', 'Employee')
    .single()
  return data?.id ?? null
}
