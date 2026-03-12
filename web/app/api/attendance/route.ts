import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, isHrOrAdmin } from '@/lib/utils/auth'
import { okWithPagination, badRequest, buildPaginationMeta, serverError } from '@/lib/utils/response'
import { AttendanceQuerySchema } from '@/lib/validations/attendance'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()

    // 1. Parse & validasi query params
    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams.entries())
    const parsed = AttendanceQuerySchema.safeParse(params)
    
    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message)
    }

    const { page, limit, month, employee_id, status, department_id, sort_dir } = parsed.data
    const offset = (page - 1) * limit

    // 2. Build Query
    let query = admin
      .from('attendances')
      .select(`
        id, attendance_date, check_in, check_out, work_hours, late_minutes,
        overtime_hours, is_manual, check_in_is_valid_location, check_out_is_valid_location,
        check_in_face_confidence, check_out_face_confidence,
        status:attendance_status(code, name, color),
        employee:employees!attendances_employee_id_fkey(
          id, full_name, employee_code,
          department:departments(name),
          position:positions(name)
        )
      `, { count: 'exact' })
      .eq('tenant_id', user.tenant_id)

    // 3. Filter Logic
    
    // User Biasa: hanya miliknya sendiri
    if (!isHrOrAdmin(user)) {
      if (!user.employee_id) return badRequest('Profil karyawan tidak ditemukan.')
      query = query.eq('employee_id', user.employee_id)
    } else {
      // HR/Admin: bisa filter karyawan lain
      if (employee_id) {
        query = query.eq('employee_id', employee_id)
      }
    }

    // Filter Bulan (YYYY-MM)
    if (month) {
      const [year, monthNum] = month.split('-').map(Number)
      const lastDay = new Date(year, monthNum, 0).getDate()
      query = query
        .gte('attendance_date', `${month}-01`)
        .lte('attendance_date', `${month}-${lastDay}`)
    }

    // Filter Status — resolve code to id first
    if (status) {
      const { data: statusRow } = await admin
        .from('attendance_status')
        .select('id')
        .eq('code', status)
        .single()
      if (statusRow) {
        query = query.eq('status_id', statusRow.id)
      }
    }

    // Filter Department — resolve to employee_ids first
    if (department_id) {
      const { data: empInDept } = await admin
        .from('employees')
        .select('id')
        .eq('department_id', department_id)
        .eq('tenant_id', user.tenant_id)
        .is('deleted_at', null)
      const empIds = (empInDept ?? []).map((e: any) => e.id)
      if (empIds.length > 0) {
        query = query.in('employee_id', empIds)
      } else {
        // No employees in this department, return empty
        return okWithPagination([], buildPaginationMeta(0, page, limit))
      }
    }

    // 4. Pagination & Sort
    query = query
      .order('attendance_date', { ascending: sort_dir === 'asc' })
      .range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) throw error

    return okWithPagination(
      data ?? [],
      buildPaginationMeta(count ?? 0, page, limit)
    )

  } catch (error) {
    console.error('[Attendance List Error]', error)
    return serverError(error)
  }
}
