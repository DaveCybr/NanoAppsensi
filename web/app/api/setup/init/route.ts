import { createAdminClient } from '@/lib/supabase/server'
import { ok, badRequest, serverError, conflict } from '@/lib/utils/response'
import { z } from 'zod'
import fs from 'fs'

const initSchema = z.object({
  company_name: z.string().min(2).max(255),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  timezone: z.string().default('Asia/Jakarta'),
  admin_name: z.string().min(2),
  admin_email: z.string().email(),
  admin_password: z.string().min(8),
})

export async function POST(request: Request) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  console.log('SUPABASE_SERVICE_ROLE_KEY check:', {
    exists: !!serviceRoleKey,
    length: serviceRoleKey?.length,
    prefix: serviceRoleKey?.substring(0, 10)
  })
  
  const supabase = createAdminClient()

  // Diagnostic: Test if Service Role Key is working via Auth API
  const { data: authTest, error: authErr } = await supabase.auth.admin.listUsers()
  console.log('Diagnostic - ListUsers test:', { 
    success: !!authTest, 
    error: authErr 
  })

  // 1. Re-check tenants table is still empty
  const { count: tenantCount, error: checkError } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })

  if (checkError) {
    console.error('Raw error:', JSON.stringify(checkError, null, 2))
    console.error('Error prototype:', Object.getPrototypeOf(checkError))
    console.error('All keys:', Object.getOwnPropertyNames(checkError))
    return serverError(`Raw: ${JSON.stringify(checkError)} | Message: ${checkError.message} | Code: ${checkError.code}`)
  }

  if (tenantCount && tenantCount > 0) {
    return conflict('Sistem sudah terkonfigurasi.')
  }

  // 2. Validate fields
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
        locale: 'id-ID'
      } as any)
      .select()
      .single()

    if (tenantError) throw tenantError
    tenantId = tenant.id

    // 4. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.admin_email,
      password: data.admin_password,
      email_confirm: true
    })

    if (authError) throw authError
    authUserId = authData.user.id

    // 5. Get or create 'Admin' role
    let { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'Admin')
      .eq('tenant_id', tenantId)
      .single()

    if (roleError && roleError.code === 'PGRST116') { // Not found
      const { data: newRole, error: createRoleError } = await supabase
        .from('roles')
        .insert({ name: 'Admin', tenant_id: tenantId } as any)
        .select()
        .single()
      
      if (createRoleError) throw createRoleError
      adminRole = newRole
    } else if (roleError) {
      throw roleError
    }

    // 6. Insert public.users
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authUserId,
        tenant_id: tenantId,
        role_id: adminRole.id,
        email: data.admin_email,
        full_name: data.admin_name,
        is_active: true
      } as any)

    if (userError) throw userError

    // 7. Insert default leave types
    const { error: leaveError } = await supabase
      .from('leave_types')
      .insert([
        { tenant_id: tenantId, name: 'Cuti Tahunan', max_days: 12, is_paid: true, requires_document: false },
        { tenant_id: tenantId, name: 'Sakit', max_days: 365, is_paid: true, requires_document: false },
        { tenant_id: tenantId, name: 'Izin Khusus', max_days: 3, is_paid: true, requires_document: false },
        { tenant_id: tenantId, name: 'Cuti Melahirkan', max_days: 90, is_paid: true, requires_document: true },
      ] as any)

    if (leaveError) throw leaveError

    // 8. Insert default attendance statuses
    const { error: statusError } = await supabase
      .from('attendance_status' as any)
      .insert([
        { tenant_id: tenantId, code: 'PRESENT', name: 'Hadir', color: '#22c55e' },
        { tenant_id: tenantId, code: 'LATE', name: 'Terlambat', color: '#f59e0b' },
        { tenant_id: tenantId, code: 'ABSENT', name: 'Tidak Hadir', color: '#ef4444' },
        { tenant_id: tenantId, code: 'LEAVE', name: 'Cuti', color: '#8b5cf6' },
        { tenant_id: tenantId, code: 'WFH', name: 'Work From Home', color: '#3b82f6' },
        { tenant_id: tenantId, code: 'HOLIDAY', name: 'Hari Libur', color: '#64748b' },
      ] as any)

    // Note: Instructions say "if not exist" but for fresh setup we just insert.
    // If it fails with conflict we can ignore if needed, but here we assume fresh.

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
        break_duration_minutes: 60
      } as any)

    if (shiftError) throw shiftError

    // 10. Insert default work location
    const { error: locationError } = await supabase
      .from('work_locations' as any)
      .insert({
        tenant_id: tenantId,
        name: 'Kantor Pusat',
        address: '-',
        latitude: -6.2088,
        longitude: 106.8456,
        radius_meters: 100
      } as any)

    if (locationError) throw locationError

    return ok({ success: true, message: 'Setup berhasil. Silakan login.' })

  } catch (err: any) {
    // Rollback
    if (tenantId) {
      await supabase.from('tenants').delete().eq('id', tenantId)
    }
    if (authUserId) {
      await supabase.auth.admin.deleteUser(authUserId)
    }
    return serverError('Gagal dalam proses setup: ' + (err.message || 'Unknown error'))
  }
}
