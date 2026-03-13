// web/src/lib/adminAuthService.ts
//
// Admin operations delegated to Supabase Edge Functions so that
// the service role key never appears in the browser bundle.

import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateAuthUserResult = {
  userId: string | null;
  error: string | null;
};

export type UpdateAuthUserResult = {
  error: string | null;
};

// ─── Create Auth User ─────────────────────────────────────────────────────────

/**
 * Membuat user baru di Supabase Auth tanpa mempengaruhi sesi admin.
 * Menggunakan Edge Function 'create-user' agar service role key
 * tidak pernah terekspos ke browser.
 */
export async function createAuthUser(
  email: string,
  password: string,
  metadata?: Record<string, unknown>,
): Promise<CreateAuthUserResult> {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { email, password, metadata },
  })

  if (error) {
    return { userId: null, error: error.message }
  }

  const result = data as { userId: string | null; error: string | null }
  if (result.error) {
    return { userId: null, error: translateAdminError(result.error) }
  }

  return { userId: result.userId, error: null }
}

// ─── Update Auth User password ────────────────────────────────────────────────

/**
 * Update password user via Edge Function (untuk reset password oleh HR).
 */
export async function updateAuthUserPassword(
  userId: string,
  newPassword: string,
): Promise<UpdateAuthUserResult> {
  const { data, error } = await supabase.functions.invoke('update-user-password', {
    body: { userId, newPassword },
  })

  if (error) {
    return { error: error.message }
  }

  const result = data as { error: string | null }
  return { error: result.error }
}

// ─── Delete Auth User ──────────────────────────────────────────────────────────

/**
 * Hard-delete user dari Supabase Auth (gunakan hati-hati).
 * Biasanya lebih baik pakai soft delete via employees.deleted_at.
 */
export async function deleteAuthUser(
  userId: string,
): Promise<UpdateAuthUserResult> {
  const { data, error } = await supabase.functions.invoke('delete-user', {
    body: { userId },
  })

  if (error) {
    return { error: error.message }
  }

  const result = data as { error: string | null }
  return { error: result.error }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function translateAdminError(msg: string): string {
  if (
    msg.toLowerCase().includes('already registered') ||
    msg.toLowerCase().includes('already exists') ||
    msg.toLowerCase().includes('duplicate')
  )
    return 'Email sudah terdaftar. Gunakan email lain.'
  if (msg.toLowerCase().includes('invalid email'))
    return 'Format email tidak valid.'
  if (msg.toLowerCase().includes('password'))
    return 'Password terlalu lemah. Gunakan minimal 8 karakter.'
  return msg
}
