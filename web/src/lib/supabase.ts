import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '[Supabase] Missing env vars. Pastikan .env.local sudah berisi:\n' +
    '  VITE_SUPABASE_URL=...\n' +
    '  VITE_SUPABASE_ANON_KEY=...'
  )
}

// Singleton via globalThis agar Vite HMR tidak membuat instance kedua.
// PENTING: Tidak pakai storageKey custom — biarkan Supabase pakai key default
// agar session yang sudah tersimpan di localStorage tetap terbaca.
declare global {
  // eslint-disable-next-line no-var
  var __nano_hris_supabase__: SupabaseClient<Database> | undefined
}

if (!globalThis.__nano_hris_supabase__) {
  globalThis.__nano_hris_supabase__ = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession:     true,
      autoRefreshToken:   true,
      detectSessionInUrl: true,
    },
  })
}

export const supabase = globalThis.__nano_hris_supabase__!
