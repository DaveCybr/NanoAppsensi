-- ═══════════════════════════════════════════════════════════════════════════
-- TEFA Presensi — Supabase Setup Guide
-- Jalankan query ini di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Custom Access Token Hook ────────────────────────────────────────────
-- Inject tenant_id, role, employee_id ke dalam JWT agar RLS bisa baca

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_tenant_id   UUID;
  v_employee_id UUID;
  v_role_name   TEXT;
  claims        JSONB;
BEGIN
  claims := event -> 'claims';

  -- Get user profile
  SELECT u.tenant_id, u.role_id
  INTO v_tenant_id, v_role_name
  FROM public.users u
  WHERE u.id = (event ->> 'user_id')::UUID;

  -- Get employee_id
  SELECT id INTO v_employee_id
  FROM public.employees
  WHERE user_id = (event ->> 'user_id')::UUID
    AND deleted_at IS NULL
  LIMIT 1;

  -- Get role name
  SELECT r.name INTO v_role_name
  FROM public.roles r
  JOIN public.users u ON u.role_id = r.id
  WHERE u.id = (event ->> 'user_id')::UUID;

  -- Inject into JWT app_metadata
  claims := jsonb_set(claims, '{app_metadata}', 
    COALESCE(claims -> 'app_metadata', '{}') ||
    jsonb_build_object(
      'tenant_id',   v_tenant_id,
      'employee_id', v_employee_id,
      'role',        COALESCE(v_role_name, 'staff')
    )
  );

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Daftarkan hook di: Authentication > Hooks > Custom Access Token
-- Function: public.custom_access_token_hook


-- ─── 2. Helper Functions untuk RLS ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID,
    NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_employee_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'employee_id')::UUID,
    NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_role_name()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    'staff'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_hr_or_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT get_current_role_name() IN ('admin', 'hr_manager', 'superadmin');
$$;


-- ─── 3. RLS Policies — employees ────────────────────────────────────────────

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- HR/Admin: baca semua karyawan dalam tenant
CREATE POLICY "hr_read_all_employees" ON public.employees
  FOR SELECT TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    AND is_hr_or_admin()
  );

-- Karyawan: hanya baca data sendiri
CREATE POLICY "employee_read_self" ON public.employees
  FOR SELECT TO authenticated
  USING (id = get_current_employee_id());

-- HR/Admin: insert karyawan baru
CREATE POLICY "hr_insert_employees" ON public.employees
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = get_current_tenant_id()
    AND is_hr_or_admin()
  );

-- HR/Admin: update karyawan
CREATE POLICY "hr_update_employees" ON public.employees
  FOR UPDATE TO authenticated
  USING (tenant_id = get_current_tenant_id() AND is_hr_or_admin())
  WITH CHECK (tenant_id = get_current_tenant_id() AND is_hr_or_admin());

-- HR/Admin: soft delete (update deleted_at)
-- Note: DELETE dihapus, pakai soft delete via UPDATE


-- ─── 4. RLS Policies — users ────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_read_users" ON public.users
  FOR SELECT TO authenticated
  USING (tenant_id = get_current_tenant_id() AND is_hr_or_admin());

CREATE POLICY "user_read_self" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "hr_update_users" ON public.users
  FOR UPDATE TO authenticated
  USING (tenant_id = get_current_tenant_id() AND is_hr_or_admin());


-- ─── 5. RLS Policies — departments, positions, work_locations ────────────────

ALTER TABLE public.departments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_locations ENABLE ROW LEVEL SECURITY;

-- Semua user dalam tenant bisa baca (diperlukan untuk dropdown form)
CREATE POLICY "tenant_read_departments" ON public.departments
  FOR SELECT TO authenticated
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "hr_manage_departments" ON public.departments
  FOR ALL TO authenticated
  USING (tenant_id = get_current_tenant_id() AND is_hr_or_admin())
  WITH CHECK (tenant_id = get_current_tenant_id() AND is_hr_or_admin());

CREATE POLICY "tenant_read_positions" ON public.positions
  FOR SELECT TO authenticated
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "hr_manage_positions" ON public.positions
  FOR ALL TO authenticated
  USING (tenant_id = get_current_tenant_id() AND is_hr_or_admin())
  WITH CHECK (tenant_id = get_current_tenant_id() AND is_hr_or_admin());

CREATE POLICY "tenant_read_work_locations" ON public.work_locations
  FOR SELECT TO authenticated
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "hr_manage_work_locations" ON public.work_locations
  FOR ALL TO authenticated
  USING (tenant_id = get_current_tenant_id() AND is_hr_or_admin())
  WITH CHECK (tenant_id = get_current_tenant_id() AND is_hr_or_admin());


-- ─── 6. RLS Policies — attendances ──────────────────────────────────────────

ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_read_attendances" ON public.attendances
  FOR SELECT TO authenticated
  USING (tenant_id = get_current_tenant_id() AND is_hr_or_admin());

CREATE POLICY "employee_read_own_attendance" ON public.attendances
  FOR SELECT TO authenticated
  USING (employee_id = get_current_employee_id());

-- Karyawan insert absensi sendiri (via mobile app)
CREATE POLICY "employee_insert_attendance" ON public.attendances
  FOR INSERT TO authenticated
  WITH CHECK (
    employee_id = get_current_employee_id()
    AND tenant_id = get_current_tenant_id()
  );

-- HR: bisa update (koreksi manual)
CREATE POLICY "hr_update_attendance" ON public.attendances
  FOR UPDATE TO authenticated
  USING (tenant_id = get_current_tenant_id() AND is_hr_or_admin());


-- ─── 7. Seed Data — attendance_status ───────────────────────────────────────

INSERT INTO public.attendance_status (id, code, name, color) VALUES
  (gen_random_uuid(), 'present',      'Hadir',        '#22c55e'),
  (gen_random_uuid(), 'absent',       'Tidak Hadir',  '#ef4444'),
  (gen_random_uuid(), 'late',         'Terlambat',    '#f59e0b'),
  (gen_random_uuid(), 'leave',        'Cuti',         '#a855f7'),
  (gen_random_uuid(), 'wfh',          'WFH',          '#0ea5e9'),
  (gen_random_uuid(), 'holiday',      'Libur',        '#64748b'),
  (gen_random_uuid(), 'early_out',    'Pulang Awal',  '#f97316')
ON CONFLICT DO NOTHING;


-- ─── 8. Seed Data — roles ───────────────────────────────────────────────────

INSERT INTO public.roles (id, name, description, is_system, tenant_id) VALUES
  (gen_random_uuid(), 'superadmin',  'Super Administrator',      true, NULL),
  (gen_random_uuid(), 'hr_manager',  'HR Manager',               true, NULL),
  (gen_random_uuid(), 'manager',     'Department Manager',       true, NULL),
  (gen_random_uuid(), 'staff',       'Staff / Karyawan Biasa',   true, NULL)
ON CONFLICT DO NOTHING;


-- ─── 9. Tabel Baru — grades & employment_statuses ────────────────────────────
-- Jalankan jika belum ada (Hierarchy page membutuhkan tabel ini)

CREATE TABLE IF NOT EXISTS public.grades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id),
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read_grades" ON public.grades
  FOR SELECT TO authenticated
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "hr_manage_grades" ON public.grades
  FOR ALL TO authenticated
  USING (tenant_id = get_current_tenant_id() AND is_hr_or_admin())
  WITH CHECK (tenant_id = get_current_tenant_id() AND is_hr_or_admin());


CREATE TABLE IF NOT EXISTS public.employment_statuses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id),
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

ALTER TABLE public.employment_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read_employment_statuses" ON public.employment_statuses
  FOR SELECT TO authenticated
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "hr_manage_employment_statuses" ON public.employment_statuses
  FOR ALL TO authenticated
  USING (tenant_id = get_current_tenant_id() AND is_hr_or_admin())
  WITH CHECK (tenant_id = get_current_tenant_id() AND is_hr_or_admin());


-- ─── FIX AUTH HOOK (Jalankan ini jika login gagal dengan error hook) ─────────
-- Error: "Error running hook URI: pg-functions://postgres/public/custom_access_token_hook"
-- Solusi: Perbaiki fungsi + grant permission ke supabase_auth_admin

-- 1. Grant akses ke tabel yang dibutuhkan hook
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON public.users      TO supabase_auth_admin;
GRANT SELECT ON public.employees  TO supabase_auth_admin;
GRANT SELECT ON public.roles      TO supabase_auth_admin;

-- 2. Replace fungsi dengan versi yang sudah diperbaiki (SECURITY DEFINER + exception handler)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_tenant_id   UUID;
  v_employee_id UUID;
  v_role_name   TEXT;
  claims        JSONB;
BEGIN
  claims := event -> 'claims';

  BEGIN
    -- Get tenant_id from users table
    SELECT u.tenant_id
    INTO v_tenant_id
    FROM public.users u
    WHERE u.id = (event ->> 'user_id')::UUID;

    -- Get employee_id
    SELECT id INTO v_employee_id
    FROM public.employees
    WHERE user_id = (event ->> 'user_id')::UUID
      AND deleted_at IS NULL
    LIMIT 1;

    -- Get role name
    SELECT r.name INTO v_role_name
    FROM public.roles r
    JOIN public.users u ON u.role_id = r.id
    WHERE u.id = (event ->> 'user_id')::UUID;

  EXCEPTION WHEN OTHERS THEN
    -- Jangan gagalkan login jika ada error di hook
    NULL;
  END;

  claims := jsonb_set(claims, '{app_metadata}',
    COALESCE(claims -> 'app_metadata', '{}') ||
    jsonb_build_object(
      'tenant_id',   v_tenant_id,
      'employee_id', v_employee_id,
      'role',        COALESCE(v_role_name, 'staff')
    )
  );

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Pastikan supabase_auth_admin bisa menjalankan fungsi ini
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;


-- ─── SELESAI ─────────────────────────────────────────────────────────────────
-- Setelah menjalankan SQL ini:
-- 1. Aktifkan Custom Access Token Hook di Authentication > Hooks
-- 2. Isi .env.local dengan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
-- 3. Buat tenant pertama via Table Editor
-- 4. Buat user pertama (superadmin) via Authentication > Users
-- 5. Jalankan: npm run dev
