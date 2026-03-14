import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MonthlyReportFilters = {
  startDate: string;
  endDate: string;
  departmentId?: string;
  employeeId?: string;
  page?: number;
  perPage?: number;
};

export type MonthlyReportRow = {
  employee_id: string;
  employee_name: string;
  employee_code: string | null;
  department_name: string;
  total_late_minutes: number;
  total_work_hours: number;
  total_present: number;
  total_records: number;
};

export type MonthlyReportStats = {
  total_late_minutes: number;
  total_work_hours: number;
  total_employees: number;
};

// ─── Fetch rows (aggregated per employee) ─────────────────────────────────────

export async function getMonthlyReportRows(
  tenantId: string,
  filters: MonthlyReportFilters,
): Promise<{ data: MonthlyReportRow[]; count: number; error: string | null }> {
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
      employee_id,
      late_minutes,
      work_hours,
      attendance_status ( code ),
      employees ( id, full_name, employee_code, department_id, departments ( name ) )
    `,
    )
    .eq("tenant_id", tenantId)
    .gte("attendance_date", startDate)
    .lte("attendance_date", endDate);

  if (employeeId) query = query.eq("employee_id", employeeId);

  const { data, error } = await query;
  if (error) return { data: [], count: 0, error: error.message };

  // FIX 4+9: Apply departmentId filter BEFORE aggregation so the count is
  // accurate. The previous code pushed the filter to the join column which
  // Supabase treats as a join-level filter (doesn't exclude rows, just nulls
  // the joined data), leading to wrong counts and unfiltered aggregation.
  const raw = (data ?? []).filter((r: any) => {
    if (!r.employees) return false;
    if (departmentId && r.employees.department_id !== departmentId)
      return false;
    return true;
  });

  // Aggregate client-side by employee
  const map = new Map<string, MonthlyReportRow>();
  raw.forEach((r: any) => {
    const emp = r.employees;
    const key = r.employee_id;
    if (!map.has(key)) {
      map.set(key, {
        employee_id: key,
        employee_name: emp.full_name ?? "Unknown",
        employee_code: emp.employee_code ?? null,
        department_name: emp.departments?.name ?? "—",
        total_late_minutes: 0,
        total_work_hours: 0,
        total_present: 0,
        total_records: 0,
      });
    }
    const row = map.get(key)!;
    row.total_records++;
    row.total_late_minutes += r.late_minutes ?? 0;
    row.total_work_hours += r.work_hours ?? 0;
    const code = r.attendance_status?.code ?? "";
    if (["present", "late", "early_out", "wfh"].includes(code))
      row.total_present++;
  });

  const all = Array.from(map.values()).sort((a, b) =>
    a.employee_name.localeCompare(b.employee_name),
  );

  // FIX 4: count is the total number of unique employees AFTER filtering,
  // before slicing — this is what the pagination component needs.
  const totalCount = all.length;
  const from = (page - 1) * perPage;
  const slice = all.slice(from, from + perPage);

  return { data: slice, count: totalCount, error: null };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getMonthlyReportStats(
  tenantId: string,
  filters: MonthlyReportFilters,
): Promise<{ data: MonthlyReportStats; error: string | null }> {
  const { startDate, endDate, departmentId } = filters;
  const empty: MonthlyReportStats = {
    total_late_minutes: 0,
    total_work_hours: 0,
    total_employees: 0,
  };

  const { data, error } = await supabase
    .from("attendances")
    .select(
      "employee_id, late_minutes, work_hours, employees ( department_id )",
    )
    .eq("tenant_id", tenantId)
    .gte("attendance_date", startDate)
    .lte("attendance_date", endDate);

  if (error) return { data: empty, error: error.message };

  // FIX 9: filter by departmentId in JS after fetch (same reason as above)
  const rows = (data ?? []).filter((r: any) => {
    if (departmentId && r.employees?.department_id !== departmentId)
      return false;
    return true;
  });

  const empSet = new Set(rows.map((r: any) => r.employee_id));
  return {
    data: {
      total_late_minutes: rows.reduce(
        (s: number, r: any) => s + (r.late_minutes ?? 0),
        0,
      ),
      total_work_hours: rows.reduce(
        (s: number, r: any) => s + (r.work_hours ?? 0),
        0,
      ),
      total_employees: empSet.size,
    },
    error: null,
  };
}
