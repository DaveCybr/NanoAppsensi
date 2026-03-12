// app/api/leave/types/[id]/route.ts
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireHrOrAdmin, getClientIp } from '@/lib/utils/auth'
import { ok, badRequest, conflict, notFound, serverError } from '@/lib/utils/response'
import { LeaveTypeSchema } from '@/lib/validations/leave'
import { writeAuditLog } from '@/lib/utils/audit'

interface Props {
  params: { id: string }
}

// PATCH /api/leave/types/:id
export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const body = await request.json()
    const parsed = LeaveTypeSchema.partial().safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message)
    }

    const admin = createAdminClient()

    // Ambil data lama
    const { data: oldData, error: fetchError } = await admin
      .from('leave_types')
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !oldData) return notFound('Jenis cuti')

    // Cek duplikasi jika nama berubah
    if (parsed.data.name && parsed.data.name !== oldData.name) {
      const { data: existing } = await admin
        .from('leave_types')
        .select('id')
        .eq('tenant_id', user.tenant_id)
        .eq('name', parsed.data.name)
        .is('deleted_at', null)
        .single()
      
      if (existing) return conflict('Nama jenis cuti sudah digunakan.')
    }

    const { data, error } = await admin
      .from('leave_types')
      .update(parsed.data)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    await writeAuditLog({
      user,
      action: 'UPDATE',
      entity_type: 'leave_type',
      entity_id: params.id,
      old_value: oldData,
      new_value: data,
      ip_address: getClientIp(request),
    })

    return ok(data)
  } catch (error) {
    return serverError(error)
  }
}

// DELETE /api/leave/types/:id
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()

    const { data: oldData, error: fetchError } = await admin
      .from('leave_types')
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (fetchError || !oldData) return notFound('Jenis cuti')

    const { error } = await admin
      .from('leave_types')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) throw error

    await writeAuditLog({
      user,
      action: 'DELETE',
      entity_type: 'leave_type',
      entity_id: params.id,
      old_value: oldData,
      ip_address: getClientIp(request),
    })

    return ok(null, 'Jenis cuti berhasil dihapus.')
  } catch (error) {
    return serverError(error)
  }
}
