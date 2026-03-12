import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { ok, serverError } from '@/lib/utils/response'

// GET /api/notifications
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const url    = new URL(request.url)
    const limit  = Math.min(50, parseInt(url.searchParams.get('limit') ?? '20'))
    const unread = url.searchParams.get('unread') === 'true'

    const admin = createAdminClient()
    let query = admin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('tenant_id', user.tenant_id)
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unread) {
      query = query.eq('is_read', false)
    }

    const { data, count, error } = await query
    if (error) throw error

    // Hitung unread terpisah
    const { count: unreadCount } = await admin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', user.tenant_id)
      .eq('user_id', user.id)
      .eq('is_read', false)
      .gt('expires_at', new Date().toISOString())

    return ok({
      notifications: data ?? [],
      total: count ?? 0,
      unread_count: unreadCount ?? 0,
    })
  } catch (error) {
    return serverError(error)
  }
}