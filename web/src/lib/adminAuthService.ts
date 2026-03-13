// web/src/lib/adminAuthService.ts
//
// Menggunakan Supabase Admin REST API langsung via fetch + service role key
// agar create user TIDAK auto sign-in dan TIDAK logout admin yang sedang aktif.
//
// ⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY hanya boleh ada di .env.local
//    dan TIDAK boleh di-commit ke git.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SERVICE_ROLE_KEY = import.meta.env
  .VITE_SUPABASE_SERVICE_ROLE_KEY as string;

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateAuthUserResult = {
  userId: string | null;
  error: string | null;
};

export type UpdateAuthUserResult = {
  error: string | null;
};

// ─── Create Auth User (Admin API) ────────────────────────────────────────────

/**
 * Membuat user baru di Supabase Auth tanpa mempengaruhi sesi admin.
 * Menggunakan POST /auth/v1/admin/users dengan service role key.
 *
 * @param email    - Email karyawan
 * @param password - Password awal (karyawan bisa reset nanti)
 * @param metadata - Optional: data tambahan di user_metadata
 */
export async function createAuthUser(
  email: string,
  password: string,
  metadata?: Record<string, unknown>,
): Promise<CreateAuthUserResult> {
  if (!SERVICE_ROLE_KEY) {
    return {
      userId: null,
      error: "VITE_SUPABASE_SERVICE_ROLE_KEY belum diset di .env.local",
    };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true, // skip email verification
        user_metadata: metadata ?? {},
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Supabase mengembalikan { message: '...' } atau { msg: '...' }
      const msg = data?.message ?? data?.msg ?? `HTTP ${res.status}`;
      return { userId: null, error: translateAdminError(msg) };
    }

    return { userId: data.id ?? null, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { userId: null, error: msg };
  }
}

// ─── Update Auth User password (Admin API) ────────────────────────────────────

/**
 * Update password user via Admin API (untuk reset password oleh HR).
 */
export async function updateAuthUserPassword(
  userId: string,
  newPassword: string,
): Promise<UpdateAuthUserResult> {
  if (!SERVICE_ROLE_KEY) {
    return {
      error: "VITE_SUPABASE_SERVICE_ROLE_KEY belum diset di .env.local",
    };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!res.ok) {
      const data = await res.json();
      const msg = data?.message ?? data?.msg ?? `HTTP ${res.status}`;
      return { error: msg };
    }

    return { error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { error: msg };
  }
}

// ─── Delete Auth User (Admin API) ─────────────────────────────────────────────

/**
 * Hard-delete user dari Supabase Auth (gunakan hati-hati).
 * Biasanya lebih baik pakai soft delete via employees.deleted_at.
 */
export async function deleteAuthUser(
  userId: string,
): Promise<UpdateAuthUserResult> {
  if (!SERVICE_ROLE_KEY) {
    return {
      error: "VITE_SUPABASE_SERVICE_ROLE_KEY belum diset di .env.local",
    };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data?.message ?? `HTTP ${res.status}` };
    }

    return { error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { error: msg };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function translateAdminError(msg: string): string {
  if (
    msg.toLowerCase().includes("already registered") ||
    msg.toLowerCase().includes("already exists") ||
    msg.toLowerCase().includes("duplicate")
  )
    return "Email sudah terdaftar. Gunakan email lain.";
  if (msg.toLowerCase().includes("invalid email"))
    return "Format email tidak valid.";
  if (msg.toLowerCase().includes("password"))
    return "Password terlalu lemah. Gunakan minimal 8 karakter.";
  return msg;
}
