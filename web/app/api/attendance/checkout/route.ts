import { NextRequest } from 'next/server'
import { toZonedTime, format } from 'date-fns-tz'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, getClientIp } from '@/lib/utils/auth'
import { writeAuditLog } from '@/lib/utils/audit'
import { ok, badRequest, serverError } from '@/lib/utils/response'
import { CheckOutSchema } from '@/lib/validations/attendance'
import { detectFace, compareFaces } from '@/lib/facepp/client'
import { isWithinRadius } from '@/lib/gps/utils'

export async function POST(request: NextRequest) {
  try {
    // 1. Parse & validasi body
    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body tidak valid.')

    const parsed = CheckOutSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message)
    }

    const { photo_base64, latitude, longitude, address } = parsed.data

    // 2. Get authenticated user & employee
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()

    const { data: employee, error: empError } = await admin
      .from('employees')
      .select('id, face_token, work_location_id, tenant_id')
      .eq('user_id', user.id)
      .eq('employment_status', 'active')
      .is('deleted_at', null)
      .single()

    if (empError || !employee) {
      return badRequest('Data karyawan tidak ditemukan atau tidak aktif.')
    }

    // 3. Get tenant config
    const { data: tenant, error: tenantError } = await admin
      .from('tenants')
      .select('timezone, face_confidence_threshold, overtime_threshold_hours')
      .eq('id', employee.tenant_id)
      .single()

    if (tenantError || !tenant) {
      return badRequest('Konfigurasi tenant tidak ditemukan.')
    }

    // 4. Hitung today dengan timezone
    const timezone = tenant.timezone ?? 'Asia/Jakarta'
    const now = new Date()
    const zonedNow = toZonedTime(now, timezone)
    const today = format(zonedNow, 'yyyy-MM-dd', { timeZone: timezone })

    // 5. Get attendance hari ini
    const { data: attendance, error: attError } = await admin
      .from('attendances')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('attendance_date', today)
      .single()

    if (attError || !attendance || !attendance.check_in) {
      return badRequest('Anda belum melakukan check-in hari ini.')
    }

    if (attendance.check_out) {
      return badRequest('Anda sudah melakukan check-out hari ini.')
    }

    // 6. Face verification
    const { face_token: detectedToken, face_count, error: faceError } = await detectFace(photo_base64)
    if (faceError) return badRequest('Gagal memproses verifikasi wajah.')
    if (face_count === 0) return badRequest('Wajah tidak terdeteksi.')
    if (face_count > 1) return badRequest('Terdeteksi lebih dari satu wajah.')

    const { confidence, error: compareError } = await compareFaces(detectedToken!, employee.face_token)
    if (compareError) return badRequest('Gagal membandingkan wajah.')

    if (confidence < (tenant.face_confidence_threshold ?? 80)) {
      return badRequest(
        `Verifikasi wajah gagal (score: ${confidence.toFixed(1)}%).`
      )
    }

    // 7. GPS validation
    let check_out_is_valid_location = false
    if (employee.work_location_id) {
      const { data: wl } = await admin
        .from('work_locations')
        .select('latitude, longitude, radius_meters')
        .eq('id', employee.work_location_id)
        .single()

      if (wl) {
        check_out_is_valid_location = isWithinRadius(
          latitude,
          longitude,
          wl.latitude,
          wl.longitude,
          wl.radius_meters ?? 100
        )
      }
    }

    // 8. Upload foto
    const imageBuffer = Buffer.from(photo_base64, 'base64')
    const fileName = `attendances/${employee.id}/${today}/checkout.jpg`
    const { error: uploadError } = await admin.storage
      .from('hr-photos')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) return serverError('Gagal mengunggah foto checkout.')

    const { data: { publicUrl } } = admin.storage.from('hr-photos').getPublicUrl(fileName)

    // 9. Hitung durasi kerja
    const checkInTime = new Date(attendance.check_in)
    const totalMinutes = (now.getTime() - checkInTime.getTime()) / 60000
    const workHours = parseFloat((totalMinutes / 60).toFixed(2))
    const overtimeHours = parseFloat(
      Math.max(0, workHours - (tenant.overtime_threshold_hours ?? 8)).toFixed(2)
    )

    // 10. Update attendance
    const { data: updatedAttendance, error: updateError } = await admin
      .from('attendances')
      .update({
        check_out: now.toISOString(),
        check_out_latitude: latitude,
        check_out_longitude: longitude,
        check_out_address: address,
        check_out_photo_url: publicUrl,
        check_out_face_confidence: confidence,
        check_out_is_valid_location,
        work_hours: workHours,
        overtime_hours: overtimeHours,
      })
      .eq('id', attendance.id)
      .select()
      .single()

    if (updateError) return serverError('Gagal memperbarui data checkout.')

    // 11. Audit log
    await writeAuditLog({
      user,
      action: 'UPDATE',
      entity_type: 'attendance',
      entity_id: attendance.id,
      table_name: 'attendances',
      old_value: attendance,
      new_value: updatedAttendance,
      ip_address: getClientIp(request),
    })

    return ok({
      attendance: updatedAttendance,
      work_hours: workHours,
      overtime_hours: overtimeHours,
      message: `Check-out berhasil. Total kerja: ${workHours.toFixed(1)} jam.`,
    })

  } catch (error) {
    console.error('[Check-out Error]', error)
    return serverError(error)
  }
}
