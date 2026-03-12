import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
export type AttendanceStatusRow = {
  id: string
  code: string
  name: string
  color: string | null
}

// attendance_status is a global table (no tenant_id), HR can only read/update
export async function getAttendanceStatuses(): Promise<{ data: AttendanceStatusRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('attendance_status')
    .select('id, code, name, color')
    .order('name')

  return { data: (data ?? []) as AttendanceStatusRow[], error: error?.message ?? null }
}

export async function updateAttendanceStatus(
  id: string,
  updates: { name?: string; color?: string }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('attendance_status')
    .update(updates)
    .eq('id', id)

  return { error: error?.message ?? null }
}
