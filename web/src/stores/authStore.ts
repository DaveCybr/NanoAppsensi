import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Session, Subscription } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"
import type { Tables } from "../types/database.types"

type UserProfile = Tables<"users">
type TenantInfo  = Tables<"tenants">

const ALLOWED_ROLES = ["superadmin", "hr_manager", "admin"] as const
type AllowedRole = (typeof ALLOWED_ROLES)[number]

interface AuthState {
  user:          User | null
  session:       Session | null
  profile:       UserProfile | null
  tenant:        TenantInfo | null
  roleName:      string | null
  isLoading:     boolean
  isInitialized: boolean
  error:         string | null

  initialize:        () => Promise<void>
  signIn:            (email: string, password: string) => Promise<void>
  signOut:           () => Promise<void>
  clearError:        () => void
  resetLoadingState: () => void
}

// ── Module-level singletons ────────────────────────────────────────────────────
// Disimpan di luar store agar tidak ter-reset saat store di-recreate.

// Guard: Promise yang sedang berjalan. Jika initialize() dipanggil lagi
// saat masih berjalan (StrictMode double-invoke), return Promise yang sama —
// tidak ada dua concurrent initialize().
let initPromise: Promise<void> | null = null

// Listener Supabase — disimpan agar bisa di-unsubscribe sebelum pasang baru
let authSubscription: Subscription | null = null

// ── Auth state listener ────────────────────────────────────────────────────────
function setupAuthListener(set: (s: Partial<AuthState>) => void) {
  // Unsubscribe listener lama sebelum pasang baru
  if (authSubscription) {
    authSubscription.unsubscribe()
    authSubscription = null
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        try {
          const [profile, tenant, roleName] = await Promise.all([
            fetchProfile(session.user.id),
            fetchTenant(session.user),
            fetchRoleName(session.user),
          ])
          set({ user: session.user, session, profile, tenant, roleName,
            error: null, isInitialized: true, isLoading: false })
        } catch {
          set({ user: session.user, session, profile: null, tenant: null,
            roleName: null, isInitialized: true, isLoading: false })
        }

      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        try {
          const roleName      = await fetchRoleName(session.user)
          const effectiveRole = (session.user.app_metadata?.role as string) ?? roleName ?? ""
          if (!isAllowedRole(effectiveRole)) {
            await supabase.auth.signOut()
            set({ user: null, session: null, profile: null, tenant: null,
              roleName: null, isInitialized: true, isLoading: false,
              error: "Akses Anda telah dicabut. Silakan hubungi administrator." })
            return
          }
          set({ session, user: session.user, roleName: effectiveRole })
        } catch {
          set({ session, user: session.user })
        }

      } else if (
        event === "SIGNED_OUT" ||
        (!session && (event as string) === "TOKEN_REFRESH_FAILED")
      ) {
        set({ user: null, session: null, profile: null, tenant: null,
          roleName: null, isInitialized: true, isLoading: false })
      }
    }
  )

  authSubscription = subscription
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null, session: null, profile: null, tenant: null, roleName: null,
      isLoading: false, isInitialized: false, error: null,

      initialize: async () => {
        // KUNCI FIX: Jika initialize() sudah berjalan atau sudah selesai,
        // return Promise yang sama — tidak ada eksekusi kedua.
        // Ini yang mencegah React StrictMode double-invoke dari menyebabkan
        // dua concurrent getSession() yang saling interfere.
        if (initPromise) return initPromise

        initPromise = (async () => {
          set({ isLoading: true })

          // Pasang listener SEBELUM getSession() agar tidak ada event terlewat
          setupAuthListener(s => set(s as Partial<AuthState>))

          try {
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) {
              console.warn("[Auth] getSession error:", error.message)
              set({ isInitialized: true, isLoading: false, user: null, session: null })
              return
            }

            if (!session) {
              set({ isInitialized: true, isLoading: false, user: null, session: null })
              return
            }

            // Ada session — fetch data tambahan
            const [profile, tenant, roleName] = await Promise.all([
              fetchProfile(session.user.id),
              fetchTenant(session.user),
              fetchRoleName(session.user),
            ]).catch(err => {
              console.warn("[Auth] Failed to fetch profile/tenant:", err)
              return [null, null, null] as const
            })

            set({
              user: session.user, session, profile, tenant, roleName,
              isInitialized: true, isLoading: false, error: null,
            })

          } catch (err) {
            console.error("[Auth] Initialize failed:", err)
            set({ isInitialized: true, isLoading: false, user: null, session: null })
          }
        })()

        return initPromise
      },

      signIn: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error

          if (data.user) {
            const [profile, tenant, roleName] = await Promise.all([
              fetchProfile(data.user.id),
              fetchTenant(data.user),
              fetchRoleName(data.user),
            ])
            const jwtRole       = data.user.app_metadata?.role as string | undefined
            const effectiveRole = jwtRole ?? roleName ?? ""

            if (!isAllowedRole(effectiveRole)) {
              await supabase.auth.signOut()
              throw new Error(
                `Akses ditolak. Role "${effectiveRole || "staff"}" tidak memiliki akses ke panel admin. ` +
                `Hanya ${ALLOWED_ROLES.join(", ")} yang diizinkan.`
              )
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
        // Reset guard agar initialize() bisa dipanggil lagi setelah login ulang
        initPromise = null
        set({ isLoading: true })
        try {
          await supabase.auth.signOut({ scope: "global" })
        } catch (err) {
          console.error("[Auth] Signout error:", err)
        } finally {
          set({ user: null, session: null, profile: null, tenant: null,
            roleName: null, error: null, isLoading: false })
        }
      },

      clearError:        () => set({ error: null }),
      resetLoadingState: () => set({ isLoading: false }),
    }),
    {
      name:       "tefa-auth",
      partialize: () => ({}), // tidak persist apapun ke localStorage
    },
  ),
)

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users").select("*").eq("id", userId).single()
  if (error) { console.error("[Auth] fetchProfile:", error); return null }
  return data
}

async function fetchTenant(user: User): Promise<TenantInfo | null> {
  let tenantId = user.app_metadata?.tenant_id as string | undefined

  if (!tenantId) {
    const { data } = await supabase
      .from("users").select("tenant_id").eq("id", user.id).single()
    tenantId = data?.tenant_id ?? undefined
  }

  if (!tenantId) { console.warn("[Auth] tenant_id not found"); return null }

  const { data, error } = await supabase
    .from("tenants").select("*").eq("id", tenantId).single()
  if (error) { console.error("[Auth] fetchTenant:", error); return null }
  return data
}

async function fetchRoleName(user: User): Promise<string | null> {
  const jwtRole = user.app_metadata?.role as string | undefined
  if (jwtRole) return jwtRole

  const { data } = await supabase
    .from("users").select("roles ( name )").eq("id", user.id).single()
  return (data as any)?.roles?.name ?? null
}

function isAllowedRole(role: string): boolean {
  const normalized = role.toLowerCase().replace(/\s+/g, "_")
  return (
    ALLOWED_ROLES.includes(normalized as AllowedRole) ||
    ALLOWED_ROLES.includes(role as AllowedRole)
  )
}

function translateAuthError(msg: string): string {
  if (msg.includes("Invalid login credentials"))  return "Email atau password salah."
  if (msg.includes("Email not confirmed"))         return "Email belum diverifikasi. Cek inbox kamu."
  if (msg.includes("Too many requests"))           return "Terlalu banyak percobaan. Coba lagi nanti."
  if (msg.includes("Error running hook URI"))      return "Konfigurasi auth hook bermasalah."
  if (msg.includes("Akses ditolak") || msg.includes("Akses Anda")) return msg
  return msg
}
