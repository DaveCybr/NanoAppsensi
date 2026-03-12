import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireHrOrAdmin, getClientIp } from '@/lib/utils/auth'
import { ok, badRequest, notFound, serverError, conflict } from '@/lib/utils/response'
import { writeAuditLog } from '@/lib/utils/audit'
import { HolidaySchema } from '@/lib/validations/holiday'

type RouteParams = { params: { id: string } }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireHrOrAdmin(request)
  if (!auth.ok) return auth.response
  const { user } = auth

  try {
    const body = await request.json()
    const validated = HolidaySchema.partial().safeParse(body)

    if (!validated.success) {
      return badRequest(validated.error.errors[0].message)
    }

    const supabase = createAdminClient()

    // Check existence
    const { data: existing, error: checkError } = await supabase
      .from('holidays' as any)
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (checkError) throw checkError
    if (!existing) return notFound('Hari libur')

    // Check duplicate date if date changed
    if (validated.data.date && validated.data.date !== existing.date) {
      const { data: duplicate, error: duplicateError } = await supabase
        .from('holidays' as any)
        .select('id')
        .eq('tenant_id', user.tenant_id)
        .eq('date', validated.data.date)
        .is('deleted_at', null)
        .maybeSingle()

      if (duplicateError) throw duplicateError
      if (duplicate) return conflict('Hari libur pada tanggal tersebut sudah ada.')
    }

    const { data: updated, error } = await supabase
      .from('holidays' as any)
      .update(validated.data)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    await writeAuditLog({
      user,
      action: 'UPDATE',
      entity_type: 'holiday',
      entity_id: params.id,
      table_name: 'holidays',
      old_value: existing,
      new_value: updated,
      ip_address: getClientIp(request),
    })

    return ok(updated)
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireHrOrAdmin(request)
  if (!auth.ok) return auth.response
  const { user } = auth

  const supabase = createAdminClient()

  try {
    const { data: existing, error: checkError } = await supabase
      .from('holidays' as any)
      .select('id')
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (checkError) throw checkError
    if (!existing) return notFound('Hari libur')

    const { error } = await supabase
      .from('holidays' as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) throw error

    await writeAuditLog({
      user,
      action: 'DELETE',
      entity_type: 'holiday',
      entity_id: params.id,
      table_name: 'holidays',
      ip_address: getClientIp(request),
    })

    return ok(null, 'Hari libur berhasil dihapus.')
  } catch (error) {
    return serverError(error)
  }
}
