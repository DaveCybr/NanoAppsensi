// app/api/leave/balances/route.ts
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, isHrOrAdmin } from '@/lib/utils/auth'
import { ok, badRequest, serverError } from '@/lib/utils/response'
import { LeaveBalanceQuerySchema } from '@/lib/validations/leave'

// GET /api/leave/balances
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams.entries())
    const parsed = LeaveBalanceQuerySchema.safeParse(params)
    
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)
    const { year, employee_id } = parsed.data
    
    // Auth logic
    let targetEmployeeId = user.employee_id
    if (isHrOrAdmin(user)) {
      if (employee_id) targetEmployeeId = employee_id
    } else {
      if (employee_id && employee_id !== user.employee_id) {
        const { forbidden } = await import('@/lib/utils/response')
        return forbidden()
      }
    }

    if (!targetEmployeeId) return badRequest('ID karyawan diperlukan.')

    const currentYear = year || new Date().getFullYear()

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('leave_balances')
      .select(`
        *,
        leave_type:leave_types(id, name, max_days, is_paid),
        employee:employees(id, full_name, employee_code)
      `)
      .eq('tenant_id', user.tenant_id)
      .eq('employee_id', targetEmployeeId)
      .eq('year', currentYear)

    if (error) throw error

    return ok(data ?? [])
  } catch (error) {
    return serverError(error)
  }
}
