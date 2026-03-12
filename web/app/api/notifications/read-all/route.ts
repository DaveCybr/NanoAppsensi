import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { ok, serverError } from '@/lib/utils/response'

// POST /api/notifications/read-all
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()
    await admin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('tenant_id', user.tenant_id)
      .eq('is_read', false)

    return ok(null, 'Semua notifikasi telah dibaca.')
  } catch (error) {
    return serverError(error)
  }
}