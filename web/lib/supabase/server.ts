// ============================================================
// lib/supabase/server.ts
// Server-side Supabase client — untuk Route Handlers & Server Components
// ============================================================
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database'

// ── Server Component Client (read-only cookie) ────────────
// Gunakan ini di Server Components & middleware
// Cookie bisa dibaca tapi tidak bisa di-set (Next.js limitation)
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
            // Diabaikan di Server Components
          }
        },
      },
    }
  )
}

// ── Route Handler Client (bisa set cookie ke response) ────
// WAJIB gunakan ini di Route Handlers (POST/GET api routes)
// agar session cookie benar-benar tersimpan ke browser
export function createRouteClient(request: NextRequest, response: NextResponse) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          // Set ke request (untuk dibaca Supabase internal)
          cookiesToSet.forEach(({ name, value }: any) => {
            request.cookies.set(name, value)
          })
          // Set ke response (yang dikirim ke browser) ← INI yang penting
          cookiesToSet.forEach(({ name, value, options }: any) => {
            response.cookies.set(name, value, options)
          })
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