// PATCH: web/src/stores/authStore.ts
// Ganti seluruh isi file dengan ini

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Tables } from "../types/database.types";

// ─── Types ────────────────────────────────────────────────────────────────────
type UserProfile = Tables<"users">;
type TenantInfo = Tables<"tenants">;

// Role yang boleh akses web admin panel
const ALLOWED_ROLES = ["superadmin", "hr_manager", "admin"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  tenant: TenantInfo | null;
  roleName: string | null; // ← tambahan: simpan role name
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  resetLoadingState: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
let authListenerSetup = false;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      session: null,
      profile: null,
      tenant: null,
      roleName: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      // ── Initialize ────────────────────────────────────────────────────────
      initialize: async () => {
        set({ isLoading: true });

        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            try {
              const [profile, tenant, roleName] = await Promise.all([
                fetchProfile(session.user.id),
                fetchTenant(session.user),
                fetchRoleName(session.user),
              ]);
              set({
                user: session.user,
                session,
                profile,
                tenant,
                roleName,
                isInitialized: true,
                isLoading: false,
                error: null,
              });
            } catch (profileError) {
              console.warn(
                "[Auth] Failed to fetch profile/tenant:",
                profileError,
              );
              set({
                user: session.user,
                session,
                profile: null,
                tenant: null,
                roleName: null,
                isInitialized: true,
                isLoading: false,
              });
            }
          } else {
            set({
              user: null,
              session: null,
              profile: null,
              tenant: null,
              roleName: null,
              isInitialized: true,
              isLoading: false,
            });
          }
        } catch (err) {
          console.error("[Auth] Initialize failed:", err);
          set({
            isInitialized: true,
            isLoading: false,
            user: null,
            session: null,
          });
        }

        // Auth state listener — only once
        if (!authListenerSetup) {
          authListenerSetup = true;
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN" && session?.user) {
              try {
                const [profile, tenant, roleName] = await Promise.all([
                  fetchProfile(session.user.id),
                  fetchTenant(session.user),
                  fetchRoleName(session.user),
                ]);
                set({
                  user: session.user,
                  session,
                  profile,
                  tenant,
                  roleName,
                  error: null,
                  isInitialized: true, // ← tambahkan ini
                  isLoading: false, // ← tambahkan ini
                });
              } catch {
                set({
                  user: session.user,
                  session,
                  profile: null,
                  tenant: null,
                  roleName: null,
                  isInitialized: true, // ← tambahkan ini
                  isLoading: false, // ← tambahkan ini
                });
              }
            } else if (event === "TOKEN_REFRESHED" && session) {
              set({ session, user: session.user });
            } else if (
              event === "SIGNED_OUT" ||
              (!session && (event as string) === "TOKEN_REFRESH_FAILED")
            ) {
              set({
                user: null,
                session: null,
                profile: null,
                tenant: null,
                roleName: null,
                isInitialized: true,
                isLoading: false,
              });
            }
          });
        }
      },

      // ── Sign In ───────────────────────────────────────────────────────────
      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;

          if (data.user) {
            const [profile, tenant, roleName] = await Promise.all([
              fetchProfile(data.user.id),
              fetchTenant(data.user),
              fetchRoleName(data.user),
            ]);

            // ── ROLE CHECK ─────────────────────────────────────────────────
            // Prioritas: cek dari JWT app_metadata (di-inject oleh hook)
            // Fallback: cek dari role yang baru di-fetch dari DB
            const jwtRole = data.user.app_metadata?.role as string | undefined;
            const effectiveRole = jwtRole ?? roleName ?? "";

            if (!isAllowedRole(effectiveRole)) {
              await supabase.auth.signOut();
              throw new Error(
                `Akses ditolak. Role "${effectiveRole || "staff"}" tidak memiliki akses ke panel admin. ` +
                  `Hanya ${ALLOWED_ROLES.join(", ")} yang diizinkan.`,
              );
            }

            set({
              user: data.user,
              session: data.session,
              profile,
              tenant,
              roleName: effectiveRole,
              error: null,
            });
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Login gagal";
          set({ error: translateAuthError(msg) });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Sign Out ──────────────────────────────────────────────────────────
      signOut: async () => {
        set({ isLoading: true });
        try {
          await supabase.auth.signOut({ scope: "global" });
        } catch (err) {
          console.error("[Auth] Signout error:", err);
        } finally {
          set({
            user: null,
            session: null,
            profile: null,
            tenant: null,
            roleName: null,
            error: null,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
      resetLoadingState: () => set({ isLoading: false }),
    }),
    {
      name: "tefa-auth",
      partialize: () => ({}), // tidak persist apapun ke localStorage
    },
  ),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) {
    console.error("[Auth] fetchProfile:", error);
    return null;
  }
  return data;
}

async function fetchTenant(user: User): Promise<TenantInfo | null> {
  // Prioritas: dari JWT app_metadata (injected by auth hook)
  let tenantId = user.app_metadata?.tenant_id as string | undefined;

  // Fallback: ambil dari tabel users jika JWT belum punya tenant_id
  if (!tenantId) {
    console.warn("[Auth] No tenant_id in JWT, falling back to DB.");
    const { data: userData } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single();
    tenantId = userData?.tenant_id ?? undefined;
  }

  if (!tenantId) {
    console.warn("[Auth] tenant_id not found for user.");
    return null;
  }

  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();
  if (error) {
    console.error("[Auth] fetchTenant:", error);
    return null;
  }
  return data;
}

/**
 * Ambil role name dari JWT app_metadata (sudah di-inject auth hook).
 * Fallback: query DB langsung jika JWT belum ter-refresh.
 */
async function fetchRoleName(user: User): Promise<string | null> {
  // Prioritas 1: dari JWT (paling fresh setelah login)
  const jwtRole = user.app_metadata?.role as string | undefined;
  if (jwtRole) return jwtRole;

  // Fallback: query DB
  const { data } = await supabase
    .from("users")
    .select("roles ( name )")
    .eq("id", user.id)
    .single();

  return (data as any)?.roles?.name ?? null;
}

function isAllowedRole(role: string): boolean {
  const normalized = role.toLowerCase().replace(/\s+/g, "_");
  return (
    ALLOWED_ROLES.includes(normalized as AllowedRole) ||
    ALLOWED_ROLES.includes(role as AllowedRole)
  );
}

function translateAuthError(msg: string): string {
  if (msg.includes("Invalid login credentials"))
    return "Email atau password salah.";
  if (msg.includes("Email not confirmed"))
    return "Email belum diverifikasi. Cek inbox kamu.";
  if (msg.includes("Too many requests"))
    return "Terlalu banyak percobaan. Coba lagi nanti.";
  if (msg.includes("User not found")) return "Akun tidak ditemukan.";
  if (msg.includes("Error running hook URI"))
    return "Konfigurasi auth hook bermasalah. Jalankan SQL fix di Supabase Dashboard.";
  if (msg.includes("Akses ditolak")) return msg; // sudah bahasa Indonesia, pass-through
  return msg;
}
