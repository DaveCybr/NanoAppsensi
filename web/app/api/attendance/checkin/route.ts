import { NextRequest } from 'next/server'
import { toZonedTime, format } from 'date-fns-tz'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, getClientIp } from '@/lib/utils/auth'
import { writeAuditLog } from '@/lib/utils/audit'
import { ok, badRequest, serverError } from '@/lib/utils/response'
import { CheckInSchema } from '@/lib/validations/attendance'
import { detectFace, compareFaces } from '@/lib/facepp/client'
import { isWithinRadius } from '@/lib/gps/utils'

export async function POST(request: NextRequest) {
  try {
    // 1. Parse & validasi body
    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body tidak valid.')

    const parsed = CheckInSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message)
    }

    const { photo_base64, latitude, longitude, address, device_info } = parsed.data

    // 2. Get authenticated user
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    const admin = createAdminClient()

    // 3. Get active employee
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

    // 4. Get tenant config
    const { data: tenant, error: tenantError } = await admin
      .from('tenants')
      .select('timezone, face_confidence_threshold, overtime_threshold_hours')
      .eq('id', employee.tenant_id)
      .single()

    if (tenantError || !tenant) {
      return badRequest('Konfigurasi tenant tidak ditemukan.')
    }

    // 5. Hitung "today" dengan timezone tenant
    const timezone = tenant.timezone ?? 'Asia/Jakarta'
    const now = new Date()
    const zonedNow = toZonedTime(now, timezone)
    const today = format(zonedNow, 'yyyy-MM-dd', { timeZone: timezone })

    // 6. Cek sudah check-in hari ini
    const { data: existingAttendance } = await admin
      .from('attendances')
      .select('id, check_in')
      .eq('employee_id', employee.id)
      .eq('attendance_date', today)
      .single()

    if (existingAttendance?.check_in) {
      return badRequest('Anda sudah melakukan check-in hari ini.')
    }

    // 7. Face verification
    const { face_token: detectedToken, face_count, error: faceError } = await detectFace(photo_base64)
    if (faceError) return badRequest('Gagal memproses verifikasi wajah.')
    if (face_count === 0) return badRequest('Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.')
    if (face_count > 1) return badRequest('Terdeteksi lebih dari satu wajah. Pastikan hanya ada satu wajah di kamera.')

    const { confidence, error: compareError } = await compareFaces(detectedToken!, employee.face_token)
    if (compareError) return badRequest('Gagal membandingkan wajah.')

    if (confidence < (tenant.face_confidence_threshold ?? 80)) {
      return badRequest(
        `Verifikasi wajah gagal (score: ${confidence.toFixed(1)}%). Coba lagi dengan pencahayaan lebih baik.`
      )
    }

    // 8. GPS validation
    let check_in_is_valid_location = false
    if (employee.work_location_id) {
      const { data: wl } = await admin
        .from('work_locations')
        .select('latitude, longitude, radius_meters')
        .eq('id', employee.work_location_id)
        .single()

      if (wl) {
        check_in_is_valid_location = isWithinRadius(
          latitude,
          longitude,
          wl.latitude,
          wl.longitude,
          wl.radius_meters ?? 100
        )
      }
    }

    // 9. Shift & late calculation
    // Get shift hari ini
    const { data: empShift } = await admin
      .from('employee_shifts')
      .select('*, shifts(*)')
      .eq('employee_id', employee.id)
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('start_date', { ascending: false })
      .limit(1)
      .single()

    let late_minutes = 0
    let statusCode = 'PRESENT'

    const shift = empShift?.shifts
    if (shift) {
      // shift.start_time format: HH:mm:ss
      const [sh, sm, ss] = shift.start_time.split(':').map(Number)
      
      // Buat shiftStart di timezone tenant
      const shiftStart = new Date(zonedNow)
      shiftStart.setHours(sh, sm, ss || 0, 0)

      const diffMinutes = Math.floor((zonedNow.getTime() - shiftStart.getTime()) / 60000)
      const tolerance = shift.late_tolerance_minutes ?? 15
      
      late_minutes = Math.max(0, diffMinutes - tolerance)
      statusCode = late_minutes > 0 ? 'LATE' : 'PRESENT'
    }

    // 10. Upload foto
    const imageBuffer = Buffer.from(photo_base64, 'base64')
    const fileName = `hr-photos/attendances/${employee.id}/${today}/checkin.jpg`
    const { data: uploadData, error: uploadError } = await admin.storage
      .from('hr-photos') // Assuming the bucket name is 'hr-photos' but the path starts with 'attendances'
      .upload(`attendances/${employee.id}/${today}/checkin.jpg`, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('[Upload Error]', uploadError)
      return serverError('Gagal mengunggah foto absensi.')
    }

    const { data: { publicUrl } } = admin.storage.from('hr-photos').getPublicUrl(`attendances/${employee.id}/${today}/checkin.jpg`)

    // 11. Get status_id
    const { data: statusObj } = await admin
      .from('attendance_status')
      .select('id')
      .eq('code', statusCode)
      .single()

    if (!statusObj) return serverError('Status absensi tidak valid di sistem.')

    // 12. Upsert attendance
    const attendanceData = {
      tenant_id: employee.tenant_id,
      employee_id: employee.id,
      attendance_date: today,
      check_in: now.toISOString(),
      check_in_latitude: latitude,
      check_in_longitude: longitude,
      check_in_address: address,
      check_in_photo_url: publicUrl,
      check_in_face_confidence: confidence,
      check_in_is_valid_location,
      status_id: statusObj.id,
      late_minutes,
      device_info,
    }

    const { data: attendance, error: upsertError } = await admin
      .from('attendances')
      .upsert(attendanceData, { onConflict: 'employee_id,attendance_date' })
      .select('id, attendance_date, check_in, late_minutes')
      .single()

    if (upsertError) {
      console.error('[Upsert Error]', upsertError)
      return serverError('Gagal menyimpan data absensi.')
    }

    // 13. Audit log
    await writeAuditLog({
      user,
      action: 'CREATE',
      entity_type: 'attendance',
      entity_id: attendance.id,
      table_name: 'attendances',
      new_value: attendance,
      ip_address: getClientIp(request),
    })

    const message = statusCode === 'LATE' 
      ? `Terlambat ${late_minutes} menit.` 
      : 'Selamat bekerja!'

    return ok({
      attendance,
      face_confidence: confidence,
      is_valid_location: check_in_is_valid_location,
      status: statusCode,
      late_minutes,
      message,
    })

  } catch (error) {
    console.error('[Check-in Error]', error)
    return serverError(error)
  }
}
