import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireHrOrAdmin, getClientIp } from '@/lib/utils/auth'
import { writeAuditLog } from '@/lib/utils/audit'
import { ok, badRequest, notFound, conflict, serverError } from '@/lib/utils/response'
import { z } from 'zod'

const UpdateWorkLocationSchema = z.object({
  name:           z.string().min(2).max(255).optional(),
  address:        z.string().optional().nullable(),
  latitude:       z.number().min(-90).max(90).optional(),
  longitude:      z.number().min(-180).max(180).optional(),
  radius_meters:  z.number().min(10).max(5000).optional(),
  is_default:     z.boolean().optional(),
})

type RouteParams = { params: { id: string } }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body tidak valid.')

    const parsed = UpdateWorkLocationSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const admin = createAdminClient()

    const { data: existing, error: checkError } = await admin
      .from('work_locations' as any)
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .single()

    if (checkError || !existing) return notFound('Lokasi kerja')

    // Cek duplikasi nama jika berubah
    if (parsed.data.name && parsed.data.name !== existing.name) {
      const { data: dup } = await admin
        .from('work_locations' as any)
        .select('id')
        .eq('tenant_id', user.tenant_id)
        .eq('name', parsed.data.name)
        .is('deleted_at', null)
        .single()
      if (dup) return conflict('Nama lokasi kerja sudah ada.')
    }

    // Jika set default, unset yang lain
    if (parsed.data.is_default) {
      await admin
        .from('work_locations' as any)
        .update({ is_default: false })
        .eq('tenant_id', user.tenant_id)
        .neq('id', params.id)
    }

    const { data: updated, error } = await admin
      .from('work_locations' as any)
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    await writeAuditLog({
      user,
      action: 'UPDATE',
      entity_type: 'work_location',
      entity_id: params.id,
      table_name: 'work_locations',
      old_value: existing,
      new_value: updated,
      ip_address: getClientIp(request),
    })

    return ok(updated, 'Lokasi kerja berhasil diperbarui.')
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()

    const { data: existing, error: checkError } = await admin
      .from('work_locations' as any)
      .select('id, name, is_default')
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .single()

    if (checkError || !existing) return notFound('Lokasi kerja')

    if (existing.is_default) {
      return badRequest('Tidak dapat menghapus lokasi kerja default.')
    }

    await admin
      .from('work_locations' as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)

    await writeAuditLog({
      user,
      action: 'DELETE',
      entity_type: 'work_location',
      entity_id: params.id,
      table_name: 'work_locations',
      ip_address: getClientIp(request),
    })

    return ok(null, 'Lokasi kerja berhasil dihapus.')
  } catch (error) {
    return serverError(error)
  }
}