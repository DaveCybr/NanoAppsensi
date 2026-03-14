import { supabase } from "./supabase";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityReportFilters = {
  startDate: string;
  endDate: string;
  departmentId?: string;
  search?: string;
  page?: number;
  perPage?: number;
};

export type ActivityRow = {
  id: string;
  attendance_date: string;
  employee_name: string;
  employee_code: string | null;
  title: string;
  description: string;
  time: string;
  location: string;
  status_color: string | null;
};

// ─── Fetch rows ───────────────────────────────────────────────────────────────

export async function getActivityReportRows(
  tenantId: string,
  filters: ActivityReportFilters,
): Promise<{ data: ActivityRow[]; count: number; error: string | null }> {
  const { startDate, endDate, departmentId, page = 1, perPage = 20 } = filters;

  // FIX 9: Fetch with employees.department_id included so we can filter in JS.
  // Supabase's .eq('employees.department_id', x) on a join only nulls the
  // joined row — it does NOT exclude the parent row, so count and results
  // would both be wrong if we relied on it.
  const { data, error } = await supabase
    .from("attendances")
    .select(
      `
      id, attendance_date, check_in, check_out,
      check_in_is_valid_location, late_minutes,
      attendance_status ( code, name, color ),
      employees ( id, full_name, employee_code, department_id, departments ( name ) )
    `,
    )
    .eq("tenant_id", tenantId)
    .gte("attendance_date", startDate)
    .lte("attendance_date", endDate)
    .order("attendance_date", { ascending: false })
    .order("check_in", { ascending: true, nullsFirst: false });

  if (error) return { data: [], count: 0, error: error.message };

  const fmt = (ts: string | null) => {
    if (!ts) return "—";
    try {
      return format(new Date(ts), "HH:mm");
    } catch {
      return "—";
    }
  };

  const locLabel = (v: boolean | null) => {
    if (v === true) return "Dalam Area";
    if (v === false) return "Luar Area";
    return "WFH";
  };

  const search = (filters.search ?? "").toLowerCase();

  // FIX 9: apply both departmentId and search filters in JS BEFORE counting
  // so totalCount accurately reflects what the user sees.
  const filtered = (data ?? []).filter((r: any) => {
    if (!r.employees) return false;
    if (departmentId && r.employees.department_id !== departmentId)
      return false;
    if (search) {
      const name = r.employees.full_name?.toLowerCase() ?? "";
      const code = r.employees.employee_code?.toLowerCase() ?? "";
      if (!name.includes(search) && !code.includes(search)) return false;
    }
    return true;
  });

  // FIX 4: count AFTER filtering, BEFORE slicing
  const totalCount = filtered.length;
  const from = (page - 1) * perPage;
  const sliced = filtered.slice(from, from + perPage);

  const rows: ActivityRow[] = sliced.map((r: any) => ({
    id: r.id,
    attendance_date: r.attendance_date,
    employee_name: r.employees?.full_name ?? "Unknown",
    employee_code: r.employees?.employee_code ?? null,
    title: r.attendance_status?.name ?? "—",
    description:
      r.late_minutes > 0
        ? `Terlambat ${r.late_minutes} menit`
        : r.check_out
          ? "Hadir tepat waktu"
          : "Belum check out",
    time: fmt(r.check_in),
    location: locLabel(r.check_in_is_valid_location),
    status_color: r.attendance_status?.color ?? null,
  }));

  return { data: rows, count: totalCount, error: null };
}
