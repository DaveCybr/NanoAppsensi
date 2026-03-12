import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { ok, notFound, serverError } from '@/lib/utils/response'

type RouteParams = { params: { id: string } }

// PATCH /api/notifications/:id/read  — mark as read
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !data) return notFound('Notifikasi')

    return ok(data, 'Notifikasi ditandai sudah dibaca.')
  } catch (error) {
    return serverError(error)
  }
}

// DELETE /api/notifications/:id
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()
    const { error } = await admin
      .from('notifications')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) throw error

    return ok(null, 'Notifikasi dihapus.')
  } catch (error) {
    return serverError(error)
  }
}