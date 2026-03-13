// web/src/lib/sessionGuard.ts

import { supabase } from './supabase'

/**
 * Returns true if there is a valid active session.
 * Use this before making Supabase queries in hooks that could run after
 * a long idle period, to avoid 400/403 errors from stale tokens.
 */
export async function hasValidSession(): Promise<boolean> {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) return false

  // Consider expired if within 30s of expiry
  const expiresAt = session.expires_at ?? 0
  const nowSeconds = Math.floor(Date.now() / 1000)
  return expiresAt > nowSeconds + 30
}
