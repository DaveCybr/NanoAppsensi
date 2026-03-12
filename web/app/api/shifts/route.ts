import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireHrOrAdmin, requireAuth, getClientIp } from '@/lib/utils/auth'
import { ok, created, badRequest, serverError, conflict } from '@/lib/utils/response'
import { writeAuditLog } from '@/lib/utils/audit'
import { ShiftSchema, ShiftQuerySchema } from '@/lib/validations/shift'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { user } = auth

  const { searchParams } = new URL(request.url)
  const query = ShiftQuerySchema.safeParse(Object.fromEntries(searchParams))

  if (!query.success) {
    return badRequest(query.error.errors[0].message)
  }

  const { search, sort_dir } = query.data
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  try {
    let q = supabase
      .from('shifts')
      .select(`
        id, name, start_time, end_time, is_overnight, 
        late_tolerance_minutes, break_duration_minutes, created_at
      `)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .order('name', { ascending: sort_dir === 'asc' })

    if (search) {
      q = q.ilike('name', `%${search}%`)
    }

    const { data: shifts, error } = await q

    if (error) throw error

    // Fetch employee counts for each shift
    const shiftsWithCount = await Promise.all((shifts || []).map(async (shift) => {
      const { count, error: countError } = await supabase
        .from('employee_shifts' as any)
        .select('*', { count: 'exact', head: true })
        .eq('shift_id', shift.id)
        .or(`end_date.is.null,end_date.gte.${today}`)

      if (countError) console.error(`Error counting employees for shift ${shift.id}:`, countError)

      return {
        ...shift,
        employee_count: count || 0
      }
    }))

    return ok(shiftsWithCount)
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
    const validated = ShiftSchema.safeParse(body)

    if (!validated.success) {
      return badRequest(validated.error.errors[0].message)
    }

    const supabase = createAdminClient()

    // Check duplicate name
    const { data: existing, error: checkError } = await supabase
      .from('shifts')
      .select('id')
      .eq('tenant_id', user.tenant_id)
      .eq('name', validated.data.name)
      .is('deleted_at', null)
      .maybeSingle()

    if (checkError) throw checkError
    if (existing) {
      return conflict('Nama shift sudah digunakan.')
    }

    const { data: shift, error } = await supabase
      .from('shifts')
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
      entity_type: 'shift',
      entity_id: shift.id,
      table_name: 'shifts',
      new_value: shift,
      ip_address: getClientIp(request),
    })

    return created(shift)
  } catch (error) {
    return serverError(error)
  }
}
