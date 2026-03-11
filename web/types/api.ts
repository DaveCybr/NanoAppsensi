// ============================================================
// types/api.ts
// Request & Response contracts — dipakai web dan Flutter
// ============================================================

// ── Standard API Response ──────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: PaginationMeta
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

// ── Auth ───────────────────────────────────────────────────
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: AuthUser
  access_token: string
  refresh_token: string
  expires_at: number
}

export interface AuthUser {
  id: string
  email: string
  full_name: string | null
  tenant_id: string
  role_name: string | null
  employee_id: string | null    // null jika user adalah admin tanpa profil karyawan
  is_active: boolean
}

export interface MeResponse {
  user: AuthUser
  tenant: {
    id: string
    name: string
    slug: string
    logo_url: string | null
    timezone: string
    subscription_plan: string
  }
  permissions: string[]         // ['attendance:read', 'leave:approve', ...]
}

// ── Employee ───────────────────────────────────────────────
export interface EmployeeListItem {
  id: string
  employee_code: string | null
  full_name: string
  email: string | null          // dari join ke users
  phone: string | null
  employment_status: string
  hire_date: string | null
  photo_url: string | null
  department: { id: string; name: string } | null
  position: { id: string; name: string } | null
  work_location: { id: string; name: string } | null
}

export interface EmployeeDetail extends EmployeeListItem {
  user_id: string | null
  manager: { id: string; full_name: string } | null
  birth_date: string | null
  gender: string | null
  marital_status: string | null
  national_id: string | null
  address: string | null
  face_image_url: string | null
  created_at: string
  updated_at: string
}

// ── Attendance ─────────────────────────────────────────────
export interface AttendanceListItem {
  id: string
  attendance_date: string
  check_in: string | null
  check_out: string | null
  work_hours: number | null
  late_minutes: number
  overtime_hours: number
  is_manual: boolean
  check_in_is_valid_location: boolean
  check_out_is_valid_location: boolean
  status: { code: string; name: string; color: string | null } | null
  employee: {
    id: string
    full_name: string
    employee_code: string | null
    department: { name: string } | null
  }
}

export interface CheckInRequest {
  photo_base64: string
  latitude: number
  longitude: number
  address?: string
  device_info?: { os?: string; browser?: string; device_id?: string }
}

export interface CheckInResponse {
  attendance: AttendanceListItem
  face_confidence: number
  is_valid_location: boolean
  status: string
  late_minutes: number
  message: string
}

// ── Leave ──────────────────────────────────────────────────
export interface LeaveRequestPayload {
  leave_type_id: string
  start_date: string
  end_date: string
  reason: string
  attachment_url?: string
}

export interface LeaveApprovalPayload {
  action: 'approve' | 'reject'
  rejection_note?: string
}

// ── Pagination Query ───────────────────────────────────────
export interface PaginationQuery {
  page?: number
  limit?: number
  search?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}

export interface AttendanceQuery extends PaginationQuery {
  month?: string             // format: YYYY-MM
  employee_id?: string
  status?: string
  department_id?: string
}

export interface LeaveQuery extends PaginationQuery {
  year?: string
  status?: string
  employee_id?: string
}
