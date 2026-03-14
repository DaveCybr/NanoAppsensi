/**
 * Session guard yang TIDAK memanggil supabase.auth.getSession().
 *
 * Root cause confirmed: getSession() hang setelah idle karena
 * Supabase GoTrueClient internal lock tidak release.
 *
 * Solusi: baca session langsung dari authStore (sudah di-maintain
 * oleh onAuthStateChange listener). Jika token hampir expired,
 * trigger refresh tapi jangan tunggu — biarkan Supabase handle
 * via autoRefreshToken yang sudah aktif.
 */
import { useAuthStore } from '../stores/authStore'
import { supabase } from './supabase'

export async function ensureValidSession(): Promise<boolean> {
  const { session } = useAuthStore.getState()

  // Tidak ada session di store → belum login
  if (!session) return false

  const nowSeconds = Math.floor(Date.now() / 1000)
  const expiresAt  = session.expires_at ?? 0

  // Token masih valid > 10 detik → langsung return, tidak perlu apa-apa
  if (expiresAt > nowSeconds + 10) return true

  // Token expired atau hampir expired → coba refresh dengan timeout ketat
  // Jika timeout, return false agar hook bisa set error state
  try {
    const result = await Promise.race([
      supabase.auth.refreshSession().then(({ data, error }) => {
        if (!error && data.session) {
          // Update store dengan session baru
          useAuthStore.setState({ session: data.session, user: data.session.user })
          return true
        }
        return false
      }),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 5_000)),
    ])
    return result
  } catch {
    return false
  }
}

export const hasValidSession = ensureValidSession
