import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database.types'

// ─── Types ────────────────────────────────────────────────────────────────────
type UserProfile = Tables<'users'>
type TenantInfo  = Tables<'tenants'>

interface AuthState {
  // State
  user:        User | null
  session:     Session | null
  profile:     UserProfile | null
  tenant:      TenantInfo | null
  isLoading:   boolean
  isInitialized: boolean
  error:       string | null

  // Actions
  initialize:  () => Promise<void>
  signIn:      (email: string, password: string) => Promise<void>
  signOut:     () => Promise<void>
  clearError:  () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:          null,
      session:       null,
      profile:       null,
      tenant:        null,
      isLoading:     false,
      isInitialized: false,
      error:         null,

      // ── Initialize on app start ──────────────────────────────────────────
      initialize: async () => {
        if (get().isInitialized) return
        set({ isLoading: true })

        try {
          const { data: { session } } = await supabase.auth.getSession()

          if (session?.user) {
            const [profile, tenant] = await Promise.all([
              fetchProfile(session.user.id),
              fetchTenant(session.user),
            ])
            set({ user: session.user, session, profile, tenant })
          }
        } catch (err) {
          console.error('[Auth] Initialize failed:', err)
        } finally {
          set({ isLoading: false, isInitialized: true })
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            const [profile, tenant] = await Promise.all([
              fetchProfile(session.user.id),
              fetchTenant(session.user),
            ])
            set({ user: session.user, session, profile, tenant, error: null })
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, session: null, profile: null, tenant: null })
          } else if (event === 'TOKEN_REFRESHED' && session) {
            set({ session })
          }
        })
      },

      // ── Sign In ───────────────────────────────────────────────────────────
      signIn: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error

          if (data.user) {
            const [profile, tenant] = await Promise.all([
              fetchProfile(data.user.id),
              fetchTenant(data.user),
            ])

            // Guard: only HR or Admin can access web panel
            if (profile && !isAdminRole(profile)) {
              await supabase.auth.signOut()
              throw new Error('Akses ditolak. Hanya HR/Admin yang dapat mengakses panel ini.')
            }

            set({ user: data.user, session: data.session, profile, tenant, error: null })
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Login gagal'
          set({ error: translateAuthError(msg) })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Sign Out ──────────────────────────────────────────────────────────
      signOut: async () => {
        set({ isLoading: true })
        await supabase.auth.signOut()
        set({ user: null, session: null, profile: null, tenant: null, isLoading: false })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'tefa-auth',
      // Only persist minimal session info — supabase handles the real token
      partialize: (state) => ({ isInitialized: state.isInitialized }),
    }
  )
)

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) { console.error('[Auth] fetchProfile:', error); return null }
  return data
}

async function fetchTenant(user: User): Promise<TenantInfo | null> {
  // tenant_id is injected into JWT by custom_access_token_hook
  const tenantId = user.app_metadata?.tenant_id as string | undefined

  if (!tenantId) {
    console.warn('[Auth] No tenant_id in JWT. Skipping tenant fetch.')
    return null
  }

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (error) { console.error('[Auth] fetchTenant:', error); return null }
  return data
}

function isAdminRole(profile: UserProfile): boolean {
  // Will be matched against role name via roles table
  // For now we check role_id existence as a soft guard
  return profile.is_active === true
}

function translateAuthError(msg: string): string {
  if (msg.includes('Invalid login credentials'))   return 'Email atau password salah.'
  if (msg.includes('Email not confirmed'))          return 'Email belum diverifikasi. Cek inbox kamu.'
  if (msg.includes('Too many requests'))            return 'Terlalu banyak percobaan. Coba lagi nanti.'
  if (msg.includes('User not found'))               return 'Akun tidak ditemukan.'
  if (msg.includes('Error running hook URI'))       return 'Konfigurasi auth hook bermasalah. Jalankan SQL perbaikan di Supabase Dashboard (lihat supabase-setup.sql bagian "Fix Auth Hook").'
  return msg
}
