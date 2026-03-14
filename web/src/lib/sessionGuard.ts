import { supabase } from './supabase'

/**
 * Pastikan session valid sebelum query. Dibungkus timeout agar tidak hang.
 * - getSession() baca dari memory/localStorage, tidak ke network
 * - refreshSession() dibungkus timeout 8 detik
 */
export async function ensureValidSession(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) return false

    const nowSeconds = Math.floor(Date.now() / 1000)
    const expiresAt  = session.expires_at ?? 0

    // Masih valid > 60 detik ke depan
    if (expiresAt > nowSeconds + 60) return true

    // Perlu refresh
    return await Promise.race([
      supabase.auth.refreshSession().then(({ error }) => !error),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 8_000)),
    ])
  } catch {
    return false
  }
}

export const hasValidSession = ensureValidSession
