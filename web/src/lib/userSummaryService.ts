import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserSummaryFilters = {
  startDate: string;
  endDate: string;
  departmentId?: string;
  employeeId?: string;
  page?: number;
  perPage?: number;
};

export type UserSummaryRow = {
  employee_id: string;
  employee_name: string;
  employee_code: string | null;
  position_name: string;
  department_name: string;
  on_time: number;
  in_tolerance: number;
  late: number;
  leave: number;
  total_present: number;
  absent: number;
  in_location: number;
  out_of_location: number;
  wfh_location: number;
  total_work_hours: number;
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function getUserSummaryRows(
  tenantId: string,
  filters: UserSummaryFilters,
): Promise<{ data: UserSummaryRow[]; count: number; error: string | null }> {
  const {
    startDate,
    endDate,
    departmentId,
    employeeId,
    page = 1,
    perPage = 15,
  } = filters;

  let query = supabase
    .from("attendances")
    .select(
      `
      employee_id, late_minutes, work_hours,
      check_in_is_valid_location,
      attendance_status ( code ),
      employees (
        id, full_name, employee_code, department_id,
        positions   ( name ),
        departments ( name )
      )
    `,
    )
    .eq("tenant_id", tenantId)
    .gte("attendance_date", startDate)
    .lte("attendance_date", endDate);

  if (employeeId) query = query.eq("employee_id", employeeId);

  const { data, error } = await query;
  if (error) return { data: [], count: 0, error: error.message };

  // FIX 4+9: filter by departmentId in JS after the fetch so that the
  // aggregation and total count are both accurate.
  const raw = (data ?? []).filter((r: any) => {
    if (!r.employees) return false;
    if (departmentId && r.employees.department_id !== departmentId)
      return false;
    return true;
  });

  // Aggregate per employee
  const map = new Map<string, UserSummaryRow>();
  raw.forEach((r: any) => {
    const emp = r.employees;
    const key = r.employee_id;
    if (!map.has(key)) {
      map.set(key, {
        employee_id: key,
        employee_name: emp.full_name ?? "Unknown",
        employee_code: emp.employee_code ?? null,
        position_name: emp.positions?.name ?? "—",
        department_name: emp.departments?.name ?? "—",
        on_time: 0,
        in_tolerance: 0,
        late: 0,
        leave: 0,
        total_present: 0,
        absent: 0,
        in_location: 0,
        out_of_location: 0,
        wfh_location: 0,
        total_work_hours: 0,
      });
    }
    const row = map.get(key)!;
    const code = r.attendance_status?.code ?? "";
    const lm = r.late_minutes ?? 0;

    row.total_work_hours += r.work_hours ?? 0;

    if (code === "absent") {
      row.absent++;
    } else if (["leave", "sick"].includes(code)) {
      row.leave++;
      row.total_present++;
    } else {
      row.total_present++;
      if (lm === 0) row.on_time++;
      else if (lm <= 15) row.in_tolerance++;
      else row.late++;
    }

    const loc = r.check_in_is_valid_location;
    if (loc === true) row.in_location++;
    else if (loc === false) row.out_of_location++;
    else row.wfh_location++;
  });

  const all = Array.from(map.values()).sort((a, b) =>
    a.employee_name.localeCompare(b.employee_name),
  );

  // FIX 4: correct total count before slicing
  const totalCount = all.length;
  const from = (page - 1) * perPage;
  const slice = all.slice(from, from + perPage);

  return { data: slice, count: totalCount, error: null };
}
