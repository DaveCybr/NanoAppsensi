import { NextRequest } from 'next/server'
import { requireAuth, isHrOrAdmin } from '@/lib/utils/auth'
import { okWithPagination, badRequest, buildPaginationMeta, serverError } from '@/lib/utils/response'
import { AttendanceQuerySchema } from '@/lib/validations/attendance'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user, supabase } = auth

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
    let query = supabase
      .from('attendances')
      .select(`
        id, attendance_date, check_in, check_out, work_hours, late_minutes,
        overtime_hours, is_manual, check_in_is_valid_location, check_out_is_valid_location,
        check_in_face_confidence, check_out_face_confidence,
        status:attendance_status(code, name, color),
        employee:employees(
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

    // Filter Status (Join attendance_status by code)
    if (status) {
      query = query.eq('status.code', status)
    }

    // Filter Department (Join employees filter by department_id)
    if (department_id) {
      query = query.eq('employee.department_id', department_id)
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
