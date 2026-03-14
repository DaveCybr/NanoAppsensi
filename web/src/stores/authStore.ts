import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"
import type { Tables } from "../types/database.types"

type UserProfile = Tables<"users">
type TenantInfo  = Tables<"tenants">

const ALLOWED_ROLES = ["superadmin", "hr_manager", "admin"] as const
type AllowedRole = (typeof ALLOWED_ROLES)[number]

interface AuthState {
  user: User | null; session: Session | null; profile: UserProfile | null
  tenant: TenantInfo | null; roleName: string | null
  isLoading: boolean; isInitialized: boolean; error: string | null
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void; resetLoadingState: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()
  if (error) { console.error("[Auth] fetchProfile:", error); return null }
  return data
}

async function fetchTenant(user: User): Promise<TenantInfo | null> {
  let tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) {
    const { data } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
    tenantId = data?.tenant_id ?? undefined
  }
  if (!tenantId) { console.warn("[Auth] tenant_id not found"); return null }
  const { data, error } = await supabase.from("tenants").select("*").eq("id", tenantId).single()
  if (error) { console.error("[Auth] fetchTenant:", error); return null }
  return data
}

async function fetchRoleName(user: User): Promise<string | null> {
  const jwtRole = user.app_metadata?.role as string | undefined
  if (jwtRole) return jwtRole
  const { data } = await supabase.from("users").select("roles ( name )").eq("id", user.id).single()
  return (data as any)?.roles?.name ?? null
}

function isAllowedRole(role: string): boolean {
  const n = role.toLowerCase().replace(/\s+/g, "_")
  return ALLOWED_ROLES.includes(n as AllowedRole) || ALLOWED_ROLES.includes(role as AllowedRole)
}

function translateAuthError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Email atau password salah."
  if (msg.includes("Email not confirmed")) return "Email belum diverifikasi. Cek inbox kamu."
  if (msg.includes("Too many requests")) return "Terlalu banyak percobaan. Coba lagi nanti."
  if (msg.includes("Akses ditolak") || msg.includes("Akses Anda")) return msg
  return msg
}

// ── Baca session dari localStorage tanpa memanggil getSession() ───────────────
// getSession() bisa hang karena internal lock di GoTrueClient.
// localStorage berisi session yang sama, bisa dibaca synchronous.
function readSessionFromStorage(): Session | null {
  try {
    // Supabase menyimpan session dengan key: sb-{projectRef}-auth-token
    const keys = Object.keys(localStorage).filter(k =>
      k.startsWith('sb-') && k.endsWith('-auth-token')
    )
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      // Format Supabase v2: { access_token, refresh_token, user, expires_at, ... }
      if (parsed?.access_token && parsed?.user) {
        return parsed as Session
      }
    }
    return null
  } catch {
    return null
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null, session: null, profile: null, tenant: null, roleName: null,
      isLoading: false, isInitialized: false, error: null,

      initialize: async () => {
        const state = useAuthStore.getState()
        if (state.isInitialized) return
        if (state.isLoading) {
          await new Promise<void>(resolve => {
            const unsub = useAuthStore.subscribe(s => {
              if (s.isInitialized) { unsub(); resolve() }
            })
          })
          return
        }

        set({ isLoading: true })

        try {
          // FIX: Baca session dari localStorage — tidak pakai getSession()
          // yang bisa hang karena GoTrueClient internal lock setelah idle.
          const session = readSessionFromStorage()

          if (!session) {
            set({ isInitialized: true, isLoading: false, user: null, session: null })
            return
          }

          // Cek apakah token sudah expired
          const nowSeconds = Math.floor(Date.now() / 1000)
          const expiresAt  = (session as any).expires_at ?? 0

          if (expiresAt > 0 && expiresAt < nowSeconds) {
            // Token expired — coba refresh dengan timeout
            const refreshed = await Promise.race([
              supabase.auth.refreshSession().then(({ data, error }) => {
                if (!error && data.session) return data.session
                return null
              }),
              new Promise<null>(resolve => setTimeout(() => resolve(null), 8_000)),
            ])

            if (!refreshed) {
              // Refresh gagal/timeout → tidak ada session valid
              set({ isInitialized: true, isLoading: false, user: null, session: null })
              return
            }

            // Pakai session yang sudah di-refresh
            const user = refreshed.user
            const [profile, tenant, roleName] = await Promise.all([
              fetchProfile(user.id), fetchTenant(user), fetchRoleName(user),
            ]).catch(() => [null, null, null] as const)

            set({ user, session: refreshed, profile, tenant, roleName,
              isInitialized: true, isLoading: false, error: null })
            return
          }

          // Token masih valid — fetch profile/tenant
          const user = session.user
          const [profile, tenant, roleName] = await Promise.all([
            fetchProfile(user.id), fetchTenant(user), fetchRoleName(user),
          ]).catch(err => {
            console.warn("[Auth] Failed to fetch profile/tenant:", err)
            return [null, null, null] as const
          })

          set({ user, session, profile, tenant, roleName,
            isInitialized: true, isLoading: false, error: null })

        } catch (err) {
          console.error("[Auth] Initialize failed:", err)
          set({ isInitialized: true, isLoading: false, user: null, session: null })
        }
      },

      signIn: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error
          if (data.user) {
            const [profile, tenant, roleName] = await Promise.all([
              fetchProfile(data.user.id), fetchTenant(data.user), fetchRoleName(data.user),
            ])
            const effectiveRole = (data.user.app_metadata?.role as string) ?? roleName ?? ""
            if (!isAllowedRole(effectiveRole)) {
              await supabase.auth.signOut()
              throw new Error(`Akses ditolak. Role "${effectiveRole || "staff"}" tidak memiliki akses ke panel admin.`)
            }
            set({ user: data.user, session: data.session, profile, tenant,
              roleName: effectiveRole, error: null })
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Login gagal"
          set({ error: translateAuthError(msg) })
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      signOut: async () => {
        set({ isLoading: true })
        try { await supabase.auth.signOut({ scope: "global" }) }
        catch (err) { console.error("[Auth] Signout error:", err) }
        finally {
          set({ user: null, session: null, profile: null, tenant: null,
            roleName: null, error: null, isLoading: false, isInitialized: false })
        }
      },

      clearError: () => set({ error: null }),
      resetLoadingState: () => set({ isLoading: false }),
    }),
    { name: "tefa-auth", partialize: () => ({}) },
  ),
)

// ── Auth state listener — dipasang sekali di module level ─────────────────────
supabase.auth.onAuthStateChange(async (event, session) => {
  if (!useAuthStore.getState().isInitialized) return

  if (event === "SIGNED_IN" && session?.user) {
    try {
      const [profile, tenant, roleName] = await Promise.all([
        fetchProfile(session.user.id), fetchTenant(session.user), fetchRoleName(session.user),
      ])
      useAuthStore.setState({ user: session.user, session, profile, tenant, roleName, error: null })
    } catch {
      useAuthStore.setState({ user: session.user, session })
    }

  } else if (event === "TOKEN_REFRESHED" && session?.user) {
    // Update session di store dengan token baru
    useAuthStore.setState({ session, user: session.user })

  } else if (event === "SIGNED_OUT" || (!session && (event as string) === "TOKEN_REFRESH_FAILED")) {
    useAuthStore.setState({ user: null, session: null, profile: null, tenant: null,
      roleName: null, isInitialized: true, isLoading: false })
  }
})
