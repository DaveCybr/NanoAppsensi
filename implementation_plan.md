# Revised Plan: Phase 3 — Attendance API Implementation

This phase implements the multi-tenant attendance system with strict face verification, GPS validation, and timezone-aware logic.

## Core Conventions
- **Response Format**: Always `{ success, data?, error?, message?, meta? }`.
- **Auth**: `requireAuth` (all) or `requireHrOrAdmin` (HR/Admin).
- **Mutations**: Always use [createAdminClient()](file:///d:/NANO/NanoAppsensi/web/lib/supabase/server.ts#54-72) + `writeAuditLog()`.
- **Soft Delete**: `deleted_at = now()`.
- **Language**: All error messages in Bahasa Indonesia.
- **Timezone**: Always use `date-fns-tz` with `tenant.timezone` (default: `Asia/Jakarta`).

## Proposed Changes

### 1. Utilities & Validations
- **[NEW] [lib/gps/utils.ts](file:///d:/NANO/NanoAppsensi/web/lib/gps/utils.ts)**: Haversine distance and radius check.
- **[NEW] [lib/validations/attendance.ts](file:///d:/NANO/NanoAppsensi/web/lib/validations/attendance.ts)**: Zod schemas for `CheckIn`, `CheckOut`, `Query`, and `Correction`.

### 2. Check-in & Check-out
- **[NEW] [app/api/attendance/checkin/route.ts](file:///d:/NANO/NanoAppsensi/web/app/api/attendance/checkin/route.ts)**: 
    - Face verification via Face++ (detect + compare).
    - GPS validation (logged, not rejected).
    - Shift & late calculation based on `employee_shifts`.
    - Photo upload to `hr-photos/attendances/{emp_id}/{date}/checkin.jpg`.
- **[NEW] [app/api/attendance/checkout/route.ts](file:///d:/NANO/NanoAppsensi/web/app/api/attendance/checkout/route.ts)**:
    - Work hours and overtime calculation.
    - Photo upload to `hr-photos/attendances/{emp_id}/{date}/checkout.jpg`.

### 3. Reporting & Corrections
- **[NEW] [app/api/attendance/route.ts](file:///d:/NANO/NanoAppsensi/web/app/api/attendance/route.ts)**: Paginated attendance list with filters (Month, Department, Status).
- **[NEW] [app/api/attendance/today/route.ts](file:///d:/NANO/NanoAppsensi/web/app/api/attendance/today/route.ts)**: Real-time summary for HR.
- **[NEW] [app/api/attendance/corrections/route.ts](file:///d:/NANO/NanoAppsensi/web/app/api/attendance/corrections/route.ts)**: Submit correction requests.
- **[NEW] [app/api/attendance/corrections/[id]/review/route.ts](file:///d:/NANO/NanoAppsensi/web/app/api/attendance/corrections/[id]/review/route.ts)**: HR review logic with attendance record update and materialized view refresh.

## Verification Plan
- **Type Checking**: Run `npx tsc --noEmit`.
- **Manual Verification**: Test check-in/out flow via Postman/Console with base64 images.
