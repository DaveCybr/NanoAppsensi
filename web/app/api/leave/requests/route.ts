// app/api/leave/requests/route.ts
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, isHrOrAdmin, getClientIp } from '@/lib/utils/auth'
import { ok, okWithPagination, created, badRequest, conflict, serverError, buildPaginationMeta } from '@/lib/utils/response'
import { LeaveRequestSchema, LeaveQuerySchema } from '@/lib/validations/leave'
import { writeAuditLog } from '@/lib/utils/audit'
import { toZonedTime } from 'date-fns-tz'

// GET /api/leave/requests
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams.entries())
    const parsed = LeaveQuerySchema.safeParse(params)
    
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)
    const { page, limit, year, status, employee_id, leave_type_id, sort_dir } = parsed.data
    const offset = (page - 1) * limit

    const admin = createAdminClient()
    let query = admin
      .from('leave_requests')
      .select(`
        id, start_date, end_date, total_days, status, reason, attachment_url, 
        approved_at, rejection_note, created_at,
        leave_type:leave_types(id, name, is_paid),
        employee:employees(id, full_name, employee_code, department:departments(name)),
        approver:employees!leave_requests_approved_by_fkey(id, full_name)
      `, { count: 'exact' })
      .eq('tenant_id', user.tenant_id)

    // Auth logic: non-HR only see their own
    if (!isHrOrAdmin(user)) {
      if (!user.employee_id) return badRequest('Profil karyawan tidak ditemukan.')
      query = query.eq('employee_id', user.employee_id)
    } else {
      if (employee_id) query = query.eq('employee_id', employee_id)
    }

    if (status) query = query.eq('status', status)
    if (leave_type_id) query = query.eq('leave_type_id', leave_type_id)
    if (year) {
      query = query.gte('start_date', `${year}-01-01`).lte('end_date', `${year}-12-31`)
    }

    query = query
      .order('created_at', { ascending: sort_dir === 'asc' })
      .range(offset, offset + limit - 1)

    const { data, count, error } = await query
    if (error) throw error

    return okWithPagination(data ?? [], buildPaginationMeta(count ?? 0, page, limit))
  } catch (error) {
    return serverError(error)
  }
}

// POST /api/leave/requests
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    if (!user.employee_id) return badRequest('Hanya karyawan yang bisa mengajukan cuti.')

    const body = await request.json()
    const parsed = LeaveRequestSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)
    const { leave_type_id, start_date, end_date, reason, attachment_url } = parsed.data

    if (start_date > end_date) return badRequest('Tanggal awal tidak boleh setelah tanggal akhir.')

    const admin = createAdminClient()

    // Get tenant timezone for "today" check
    const { data: tenant } = await admin
      .from('tenants')
      .select('timezone')
      .eq('id', user.tenant_id)
      .single()
    
    const timezone = tenant?.timezone ?? 'Asia/Jakarta'
    const today = toZonedTime(new Date(), timezone).toISOString().split('T')[0]

    if (start_date < today) return badRequest('Tidak bisa mengajukan cuti untuk tanggal yang sudah lewat.')

    // Check leave type
    const { data: leaveType, error: typeError } = await admin
      .from('leave_types')
      .select('*')
      .eq('id', leave_type_id)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .single()

    if (typeError || !leaveType) return badRequest('Jenis cuti tidak ditemukan.')
    if (leaveType.requires_document && !attachment_url) {
      return badRequest('Jenis cuti ini memerlukan dokumen pendukung.')
    }

    // Business Day Calculation
    const start = new Date(start_date)
    const end = new Date(end_date)
    let total_days = 0
    let current = new Date(start)
    while (current <= end) {
      const day = current.getUTCDay()
      if (day !== 0 && day !== 6) total_days++
      current.setUTCDate(current.getUTCDate() + 1)
    }

    if (total_days === 0) return badRequest('Periode cuti hanya berisi hari libur akhir pekan.')

    // Check Balance
    const requestYear = parseInt(start_date.split('-')[0])
    const { data: balance, error: balanceError } = await admin
      .from('leave_balances')
      .select('remaining_days')
      .eq('employee_id', user.employee_id)
      .eq('leave_type_id', leave_type_id)
      .eq('year', requestYear)
      .single()

    if (balanceError || !balance || balance.remaining_days < total_days) {
      return badRequest(`Sisa cuti tidak mencukupi. Sisa: ${balance?.remaining_days ?? 0} hari.`)
    }

    // Overlap check
    const { data: overlap } = await admin
      .from('leave_requests')
      .select('id')
      .eq('employee_id', user.employee_id)
      .in('status', ['pending', 'approved'])
      .not('id', 'is', null) // dummy to allow further filter
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`)
      .limit(1)
      .maybeSingle()

    if (overlap) return conflict('Sudah ada pengajuan cuti yang tumpang tindih pada periode tersebut.')

    const { data, error } = await admin
      .from('leave_requests')
      .insert({
        tenant_id: user.tenant_id,
        employee_id: user.employee_id,
        leave_type_id,
        start_date,
        end_date,
        total_days,
        reason,
        attachment_url,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    await writeAuditLog({
      user,
      action: 'CREATE',
      entity_type: 'leave_request',
      entity_id: data.id,
      new_value: data,
      ip_address: getClientIp(request)
    })

    return created(data)
  } catch (error) {
    return serverError(error)
  }
}
