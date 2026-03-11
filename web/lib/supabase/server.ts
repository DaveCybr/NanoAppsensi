// ============================================================
// lib/supabase/server.ts
// Server-side Supabase client — untuk Route Handlers & Server Components
// ============================================================
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

// ── Browser Session Client (pakai cookie) ─────────────────
// Gunakan ini di Route Handlers untuk user yang login via web
export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Diabaikan di Server Components — cookies hanya bisa di-set di Route Handlers
          }
        },
      },
    }
  )
}

// ── Bearer Token Client (pakai JWT dari Flutter) ──────────
// Gunakan ini di Route Handlers yang dipanggil dari mobile
export function createBearerClient(accessToken: string) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )
}

// ── Admin Client (bypass RLS) ─────────────────────────────
// HANYA untuk operasi server-side yang perlu bypass RLS
// Contoh: payroll processing, audit logging, seed data
export function createAdminClient(): SupabaseClient<Database> {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
