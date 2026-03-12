// app/api/leave/types/route.ts
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, requireHrOrAdmin, getClientIp } from '@/lib/utils/auth'
import { ok, created, badRequest, conflict, serverError } from '@/lib/utils/response'
import { LeaveTypeSchema } from '@/lib/validations/leave'
import { writeAuditLog } from '@/lib/utils/audit'

// GET /api/leave/types
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('leave_types')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw error

    return ok(data ?? [])
  } catch (error) {
    return serverError(error)
  }
}

// POST /api/leave/types
export async function POST(request: NextRequest) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const body = await request.json()
    const parsed = LeaveTypeSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message)
    }

    const admin = createAdminClient()

    // Cek duplikasi nama
    const { data: existing } = await admin
      .from('leave_types')
      .select('id')
      .eq('tenant_id', user.tenant_id)
      .eq('name', parsed.data.name)
      .is('deleted_at', null)
      .single()

    if (existing) {
      return conflict('Jenis cuti dengan nama ini sudah ada.')
    }

    const { data, error } = await admin
      .from('leave_types')
      .insert({
        ...parsed.data,
        tenant_id: user.tenant_id,
      })
      .select()
      .single()

    if (error) throw error

    await writeAuditLog({
      user,
      action: 'CREATE',
      entity_type: 'leave_type',
      entity_id: data.id,
      new_value: data,
      ip_address: getClientIp(request),
    })

    return created(data)
  } catch (error) {
    return serverError(error)
  }
}
