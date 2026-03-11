// ============================================================
// app/api/employees/[id]/face/route.ts
// POST /api/employees/:id/face
// Register atau update foto referensi wajah karyawan
//
// Flow:
//   1. Validasi foto via Face++ detect
//   2. Upload foto ke Supabase Storage
//   3. Simpan face_token ke employees
//   4. Hapus face_token lama di Face++ (jika ada)
// ============================================================
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireHrOrAdmin, getClientIp } from '@/lib/utils/auth'
import { writeAuditLog } from '@/lib/utils/audit'
import { ok, badRequest, notFound, serverError } from '@/lib/utils/response'
import { FaceRegisterSchema } from '@/lib/validations/employee'
import { detectFace, deleteFace } from '@/lib/facepp/client'

type RouteContext = { params: { id: string } }

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireHrOrAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    // ── 1. Validasi body ───────────────────────────────
    const body   = await request.json().catch(() => null)
    if (!body) return badRequest('Request body tidak valid.')

    const parsed = FaceRegisterSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const { photo_base64 } = parsed.data
    const admin = createAdminClient()

    // ── 2. Cek employee ada ────────────────────────────
    const { data: employee, error: empError } = await admin
      .from('employees')
      .select('id, full_name, face_token, face_image_url')
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .is('deleted_at', null)
      .single()

    if (empError || !employee) return notFound('Karyawan')

    // ── 3. Deteksi wajah via Face++ ────────────────────
    const detection = await detectFace(photo_base64)

    if (detection.error) {
      return badRequest(`Face++ error: ${detection.error}`)
    }
    if (detection.face_count === 0) {
      return badRequest('Wajah tidak terdeteksi pada foto. Pastikan pencahayaan cukup dan wajah terlihat jelas.')
    }
    if (detection.face_count > 1) {
      return badRequest('Terdeteksi lebih dari satu wajah pada foto. Gunakan foto dengan satu orang saja.')
    }
    if (!detection.face_token) {
      return badRequest('Gagal mendapatkan face token. Coba foto ulang.')
    }

    // ── 4. Upload foto ke Supabase Storage ────────────
    const photoBuffer = Buffer.from(photo_base64, 'base64')
    const photoPath   = `employees/${params.id}/face_reference.jpg`

    const { error: uploadError } = await admin.storage
      .from('hr-photos')
      .upload(photoPath, photoBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('[Storage upload error]', uploadError)
      // Lanjutkan meski upload gagal — face_token tetap disimpan
    }

    const { data: urlData } = admin.storage
      .from('hr-photos')
      .getPublicUrl(photoPath)

    // ── 5. Hapus face_token lama di Face++ ─────────────
    if (employee.face_token) {
      await deleteFace(employee.face_token)
    }

    // ── 6. Update employee dengan face_token baru ──────
    const { data: updated, error: updateError } = await admin
      .from('employees')
      .update({
        face_token:     detection.face_token,
        face_image_url: urlData.publicUrl,
        updated_at:     new Date().toISOString(),
      })
      .eq('id', params.id)
      .select('id, full_name, face_image_url')
      .single()

    if (updateError) throw updateError

    // ── 7. Audit log ───────────────────────────────────
    await writeAuditLog({
      user,
      action:      'UPDATE',
      entity_type: 'employee',
      entity_id:   params.id,
      table_name:  'employees',
      old_value:   { face_token: employee.face_token ? '[EXISTS]' : null },
      new_value:   { face_token: '[UPDATED]', face_image_url: urlData.publicUrl },
      ip_address:  getClientIp(request),
      user_agent:  request.headers.get('user-agent') ?? undefined,
    })

    return ok(
      {
        employee: updated,
        face_registered: true,
      },
      `Wajah ${employee.full_name} berhasil didaftarkan.`
    )
  } catch (error) {
    return serverError(error)
  }
}
