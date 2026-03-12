import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireHrOrAdmin, requireAuth, getClientIp } from '@/lib/utils/auth'
import { ok, created, badRequest, serverError, conflict, okWithPagination, buildPaginationMeta } from '@/lib/utils/response'
import { writeAuditLog } from '@/lib/utils/audit'
import { HolidaySchema, HolidayQuerySchema } from '@/lib/validations/holiday'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { user } = auth

  const { searchParams } = new URL(request.url)
  const query = HolidayQuerySchema.safeParse(Object.fromEntries(searchParams))

  if (!query.success) {
    return badRequest(query.error.errors[0].message)
  }

  const { page, limit, year, sort_dir } = query.data
  const offset = (page - 1) * limit
  const supabase = createAdminClient()

  try {
    let q = supabase
      .from('holidays' as any)
      .select('*', { count: 'exact' })
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .order('date', { ascending: sort_dir === 'asc' })
      .range(offset, offset + limit - 1)

    if (year) {
      q = q.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`)
    }

    const { data: holidays, error, count } = await q

    if (error) throw error

    return okWithPagination(
      holidays,
      buildPaginationMeta(count || 0, page, limit)
    )
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireHrOrAdmin(request)
  if (!auth.ok) return auth.response
  const { user } = auth

  try {
    const body = await request.json()
    const validated = HolidaySchema.safeParse(body)

    if (!validated.success) {
      return badRequest(validated.error.errors[0].message)
    }

    const supabase = createAdminClient()

    // Check duplicate date
    const { data: existing, error: checkError } = await supabase
      .from('holidays' as any)
      .select('id')
      .eq('tenant_id', user.tenant_id)
      .eq('date', validated.data.date)
      .is('deleted_at', null)
      .maybeSingle()

    if (checkError) throw checkError
    if (existing) {
      return conflict('Hari libur pada tanggal tersebut sudah ada.')
    }

    const { data: holiday, error } = await supabase
      .from('holidays' as any)
      .insert({
        ...validated.data,
        tenant_id: user.tenant_id,
      })
      .select()
      .single()

    if (error) throw error

    await writeAuditLog({
      user,
      action: 'CREATE',
      entity_type: 'holiday',
      entity_id: holiday.id,
      table_name: 'holidays',
      new_value: holiday,
      ip_address: getClientIp(request),
    })

    return created(holiday)
  } catch (error) {
    return serverError(error)
  }
}
