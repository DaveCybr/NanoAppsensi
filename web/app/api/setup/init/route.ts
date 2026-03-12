// ============================================================
// app/api/setup/init/route.ts
// ============================================================
import { createAdminClient } from '@/lib/supabase/server'
import { ok, badRequest, serverError, conflict } from '@/lib/utils/response'
import { z } from 'zod'

const initSchema = z.object({
  company_name: z.string().min(2).max(255),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  timezone: z.string().default('Asia/Jakarta'),
  admin_name: z.string().min(2),
  admin_email: z.string().email(),
  admin_password: z.string().min(8),
})

export async function POST(request: Request) {
  const supabase = createAdminClient()

  // 1. Cek tenants table masih kosong
  const { count: tenantCount, error: checkError } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })

  if (checkError) {
    console.error('Check tenants error:', checkError)
    return serverError('Gagal mencek status database.')
  }

  if (tenantCount && tenantCount > 0) {
    return conflict('Sistem sudah terkonfigurasi.')
  }

  // 2. Validasi input
  const body = await request.json()
  const validate = initSchema.safeParse(body)
  if (!validate.success) {
    return badRequest('Data tidak valid: ' + validate.error.message)
  }
  const data = validate.data

  let tenantId: string | null = null
  let authUserId: string | null = null

  try {
    // 3. Insert tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: data.company_name,
        slug: data.slug,
        timezone: data.timezone,
        subscription_plan: 'basic',
        subscription_status: 'active',
        checkin_radius_meters: 100,
        face_confidence_threshold: 80,
        work_hours_per_day: 8,
        overtime_threshold_hours: 8,
        default_ptkp: 'TK0',
        locale: 'id-ID',
      })
      .select()
      .single()

    if (tenantError) throw tenantError
    tenantId = tenant.id

    // 4. Buat Admin role DULU sebelum auth user
    // Trigger handle_new_user butuh role_id dari metadata
    const { data: existingRole } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'Admin')
      .eq('tenant_id', tenantId)
      .maybeSingle()

    let adminRole = existingRole

    if (!adminRole) {
      const { data: newRole, error: createRoleError } = await supabase
        .from('roles')
        .insert({
          name: 'Admin',
          tenant_id: tenantId,
          is_system: true,
        })
        .select()
        .single()

      if (createRoleError) throw createRoleError
      adminRole = newRole
    }

    // Buat juga role HR Manager dan Employee sekalian
    await supabase.from('roles').insert([
      { name: 'HR Manager', tenant_id: tenantId, is_system: true },
      { name: 'Employee', tenant_id: tenantId, is_system: true },
    ])

    // 5. Buat Supabase Auth user DENGAN metadata
    // Trigger handle_new_user akan otomatis insert ke public.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.admin_email,
      password: data.admin_password,
      email_confirm: true,
      user_metadata: {
        tenant_id: tenantId,
        role_id: adminRole.id,
        full_name: data.admin_name,
      },
    })

    if (authError) throw authError
    authUserId = authData.user.id

    // 6. Update public.users yang sudah dibuat trigger
    // Pastikan is_active = true dan full_name terisi
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        is_active: true,
        full_name: data.admin_name,
      })
      .eq('id', authUserId)

    if (userUpdateError) throw userUpdateError

    // 7. Insert default leave types
    const { error: leaveError } = await supabase
      .from('leave_types')
      .insert([
        { tenant_id: tenantId, name: 'Cuti Tahunan', max_days: 12, is_paid: true, requires_document: false },
        { tenant_id: tenantId, name: 'Sakit', max_days: 365, is_paid: true, requires_document: false },
        { tenant_id: tenantId, name: 'Izin Khusus', max_days: 3, is_paid: true, requires_document: false },
        { tenant_id: tenantId, name: 'Cuti Melahirkan', max_days: 90, is_paid: true, requires_document: true },
      ])

    if (leaveError) throw leaveError

    // 8. Insert default attendance statuses
    // Tabel ini GLOBAL — tidak ada kolom tenant_id
    const { count: statusCount } = await supabase
      .from('attendance_status')
      .select('*', { count: 'exact', head: true })

    if (!statusCount || statusCount === 0) {
      const { error: statusError } = await supabase
        .from('attendance_status')
        .insert([
          { code: 'PRESENT', name: 'Hadir', color: '#22c55e' },
          { code: 'LATE', name: 'Terlambat', color: '#f59e0b' },
          { code: 'ABSENT', name: 'Tidak Hadir', color: '#ef4444' },
          { code: 'LEAVE', name: 'Cuti', color: '#8b5cf6' },
          { code: 'WFH', name: 'Work From Home', color: '#3b82f6' },
          { code: 'HOLIDAY', name: 'Hari Libur', color: '#64748b' },
        ])

      if (statusError) throw statusError
    }

    // 9. Insert default shift
    const { error: shiftError } = await supabase
      .from('shifts')
      .insert({
        tenant_id: tenantId,
        name: 'Reguler (Pagi)',
        start_time: '08:00:00',
        end_time: '17:00:00',
        is_overnight: false,
        late_tolerance_minutes: 15,
        break_duration_minutes: 60,
      })

    if (shiftError) throw shiftError

    // 10. Insert default work location
    const { error: locationError } = await supabase
      .from('work_locations')
      .insert({
        tenant_id: tenantId,
        name: 'Kantor Pusat',
        address: '-',
        latitude: -6.2088,
        longitude: 106.8456,
        radius_meters: 100,
      } as any)

    if (locationError) throw locationError

    return ok({ success: true, message: 'Setup berhasil. Silakan login.' })

  } catch (err: any) {
    console.error('Setup error:', err)

    // Rollback dalam urutan yang aman (child tables dulu)
    try {
      if (authUserId) {
        await supabase.auth.admin.deleteUser(authUserId)
      }
      if (tenantId) {
        await supabase.from('work_locations' as any).delete().eq('tenant_id', tenantId)
        await supabase.from('shifts').delete().eq('tenant_id', tenantId)
        await supabase.from('leave_types').delete().eq('tenant_id', tenantId)
        await supabase.from('users').delete().eq('tenant_id', tenantId)
        await supabase.from('roles').delete().eq('tenant_id', tenantId)
        await supabase.from('tenants').delete().eq('id', tenantId)
      }
    } catch (rollbackErr) {
      console.error('Rollback error:', rollbackErr)
    }

    return serverError('Gagal dalam proses setup: ' + (err.message || 'Unknown error'))
  }
}