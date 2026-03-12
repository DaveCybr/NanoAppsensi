// ============================================================
// types/database.ts
// Generated from Schema v2 — HR System
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          domain: string | null
          logo_url: string | null
          subscription_plan: string
          subscription_status: string
          timezone: string
          locale: string
          checkin_radius_meters: number
          face_confidence_threshold: number
          work_hours_per_day: number
          overtime_threshold_hours: number
          default_ptkp: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          role_id: string | null
          email: string
          full_name: string | null
          is_active: boolean
          email_verified_at: string | null
          last_login: string | null
          failed_login_count: number
          locked_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      employees: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          employee_code: string | null
          full_name: string
          phone: string | null
          department_id: string | null
          position_id: string | null
          manager_id: string | null
          work_location_id: string | null
          hire_date: string | null
          employment_status: string
          birth_date: string | null
          gender: string | null
          marital_status: string | null
          national_id: string | null
          address: string | null
          face_image_url: string | null
          face_token: string | null
          photo_url: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['employees']['Insert']>
      }
      departments: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          created_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['departments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['departments']['Insert']>
      }
      positions: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          created_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['positions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['positions']['Insert']>
      }
      roles: {
        Row: {
          id: string
          tenant_id: string | null
          name: string
          description: string | null
          is_system: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['roles']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['roles']['Insert']>
      }
      shifts: {
        Row: {
          id: string
          tenant_id: string
          name: string
          start_time: string
          end_time: string
          is_overnight: boolean
          late_tolerance_minutes: number
          break_duration_minutes: number
          created_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['shifts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['shifts']['Insert']>
      }
      attendances: {
        Row: {
          id: string
          tenant_id: string
          employee_id: string
          attendance_date: string
          check_in: string | null
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_in_address: string | null
          check_in_photo_url: string | null
          check_in_face_confidence: number | null
          check_in_is_valid_location: boolean
          check_out: string | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          check_out_address: string | null
          check_out_photo_url: string | null
          check_out_face_confidence: number | null
          check_out_is_valid_location: boolean
          work_hours: number | null
          late_minutes: number
          overtime_hours: number
          status_id: string | null
          is_manual: boolean
          approved_by: string | null
          notes: string | null
          device_info: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['attendances']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['attendances']['Insert']>
      }
      attendance_status: {
        Row: {
          id: string
          code: string
          name: string
          color: string | null
        }
        Insert: Omit<Database['public']['Tables']['attendance_status']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['attendance_status']['Insert']>
      }
      leave_requests: {
        Row: {
          id: string
          tenant_id: string
          employee_id: string
          leave_type_id: string
          start_date: string
          end_date: string
          total_days: number
          status: string
          reason: string | null
          attachment_url: string | null
          approved_by: string | null
          approved_at: string | null
          rejection_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['leave_requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['leave_requests']['Insert']>
      }
      leave_types: {
        Row: {
          id: string
          tenant_id: string
          name: string
          max_days: number
          is_paid: boolean
          requires_document: boolean
          created_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['leave_types']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['leave_types']['Insert']>
      }
      leave_balances: {
        Row: {
          id: string
          tenant_id: string
          employee_id: string
          leave_type_id: string
          year: number
          total_days: number
          used_days: number
          remaining_days: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['leave_balances']['Row'], 'id' | 'remaining_days' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['leave_balances']['Insert']>
      }
      payroll_periods: {
        Row: {
          id: string
          tenant_id: string
          name: string | null
          start_date: string
          end_date: string
          status: string
          locked_at: string | null
          locked_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payroll_periods']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['payroll_periods']['Insert']>
      }
      payroll_runs: {
        Row: {
          id: string
          payroll_period_id: string
          tenant_id: string
          run_number: number
          status: string
          total_employees: number
          total_gross: number
          total_net: number
          tax_rules_snapshot: Json | null
          bpjs_rules_snapshot: Json | null
          processed_by: string | null
          processed_at: string
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['payroll_runs']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['payroll_runs']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          type: string
          title: string
          message: string | null
          data: Json | null
          is_read: boolean
          expires_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string
          table_name: string | null
          old_value: Json | null
          new_value: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: never
      }
      devices: {
        Row: {
          id: string
          employee_id: string
          tenant_id: string
          device_id: string
          device_name: string | null
          platform: string | null
          fcm_token: string | null
          is_trusted: boolean
          last_used_at: string | null
          registered_at: string
        }
        Insert: Omit<Database['public']['Tables']['devices']['Row'], 'id' | 'registered_at'>
        Update: Partial<Database['public']['Tables']['devices']['Insert']>
      }
    }
    Views: {
      mv_monthly_attendance: {
        Row: {
          tenant_id: string
          employee_id: string
          full_name: string
          department_id: string | null
          month: string
          total_records: number
          total_present: number
          total_late: number
          total_absent: number
          total_leave: number
          total_wfh: number
          total_work_hours: number
          total_overtime_hours: number
          total_late_minutes: number
        }
      }
    }
    Functions: {
      get_current_tenant_id: { Returns: string }
      is_hr_or_admin: { Returns: boolean }
      get_current_employee_id: { Returns: string }
      refresh_attendance_stats: { Returns: void }
      decrement_leave_balance: {
        Args: {
          p_employee_id: string
          p_leave_type_id: string
          p_year: number
          p_days: number
        }
        Returns: void
      }
    }
  }
}

// ── Convenience Types ──────────────────────────────────────

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Named entity types
export type Tenant        = Tables<'tenants'>
export type User          = Tables<'users'>
export type Employee      = Tables<'employees'>
export type Department    = Tables<'departments'>
export type Position      = Tables<'positions'>
export type Role          = Tables<'roles'>
export type Shift         = Tables<'shifts'>
export type Attendance    = Tables<'attendances'>
export type AttendanceStatus = Tables<'attendance_status'>
export type LeaveRequest  = Tables<'leave_requests'>
export type LeaveType     = Tables<'leave_types'>
export type LeaveBalance  = Tables<'leave_balances'>
export type PayrollPeriod = Tables<'payroll_periods'>
export type PayrollRun    = Tables<'payroll_runs'>
export type Notification  = Tables<'notifications'>
export type AuditLog      = Tables<'audit_logs'>
export type Device        = Tables<'devices'>

// Enums
export type EmploymentStatus = 'active' | 'inactive' | 'resigned' | 'terminated'
export type LeaveStatus      = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type PayrollStatus    = 'draft' | 'processing' | 'done' | 'locked'
export type AttendanceCode   = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'HOLIDAY' | 'WFH' | 'OVERTIME'
export type AuditAction      = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT'
export type UserPlatform     = 'android' | 'ios'
