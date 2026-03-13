// web/src/lib/locationMapService.ts
// Schema aktual attendances:
//   check_in_latitude, check_in_longitude (bukan check_in_lat/lng)
//   check_out_latitude, check_out_longitude
//   check_in_is_valid_location, check_out_is_valid_location
//   late_minutes, status_id → attendance_status(code, name, color)
//   employees(full_name)

import { supabase } from "./supabase";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LiveLocationRow = {
  id: string;
  employeeName: string;
  type: "check-in" | "check-out";
  statusLabel: string;
  locationStatus: "In Zone" | "Out Zone" | "No GPS";
  time: string;
  date: string;
  lat: number | null;
  lng: number | null;
};

export type LocationMapSummary = {
  onTime: number;
  late: number;
  absent: number;
  total: number;
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function getLiveLocations(
  tenantId: string,
  date: string, // 'YYYY-MM-DD'
): Promise<{
  data: LiveLocationRow[];
  summary: LocationMapSummary;
  error: string | null;
}> {
  const empty: LocationMapSummary = { onTime: 0, late: 0, absent: 0, total: 0 };

  const { data, error } = await supabase
    .from("attendances")
    .select(
      `
      id,
      check_in,
      check_in_latitude,
      check_in_longitude,
      check_in_is_valid_location,
      check_out,
      check_out_latitude,
      check_out_longitude,
      check_out_is_valid_location,
      late_minutes,
      attendance_status ( code, name, color ),
      employees ( full_name )
    `,
    )
    .eq("tenant_id", tenantId)
    .eq("attendance_date", date)
    .order("check_in", { ascending: false });

  if (error) return { data: [], summary: empty, error: error.message };

  const rows: LiveLocationRow[] = [];
  const summary: LocationMapSummary = {
    onTime: 0,
    late: 0,
    absent: 0,
    total: 0,
  };

  (data ?? []).forEach((r: any) => {
    const name = r.employees?.full_name ?? "Unknown";
    const code = r.attendance_status?.code ?? "";
    const lateMin = r.late_minutes ?? 0;

    summary.total++;
    if (code === "absent") summary.absent++;
    else if (lateMin > 0) summary.late++;
    else summary.onTime++;

    const fmtTime = (ts: string | null) => {
      if (!ts) return "—";
      try {
        return format(new Date(ts), "HH:mm:ss") + " WIB";
      } catch {
        return "—";
      }
    };
    const fmtDate = (ts: string | null) => {
      if (!ts) return "—";
      try {
        return format(new Date(ts), "dd-MM-yyyy");
      } catch {
        return "—";
      }
    };

    // Status label
    let statusLabel = r.attendance_status?.name ?? "Lainnya";
    if (lateMin > 0) statusLabel = `Terlambat ${lateMin} mnt`;

    // Check-in entry
    if (r.check_in) {
      const hasGps =
        r.check_in_latitude != null && r.check_in_longitude != null;
      rows.push({
        id: `${r.id}-in`,
        employeeName: name,
        type: "check-in",
        statusLabel,
        locationStatus: !hasGps
          ? "No GPS"
          : r.check_in_is_valid_location
            ? "In Zone"
            : "Out Zone",
        time: fmtTime(r.check_in),
        date: fmtDate(r.check_in),
        lat: r.check_in_latitude ?? null,
        lng: r.check_in_longitude ?? null,
      });
    }

    // Check-out entry
    if (r.check_out) {
      const hasGps =
        r.check_out_latitude != null && r.check_out_longitude != null;
      rows.push({
        id: `${r.id}-out`,
        employeeName: name,
        type: "check-out",
        statusLabel: "Check Out",
        locationStatus: !hasGps
          ? "No GPS"
          : r.check_out_is_valid_location
            ? "In Zone"
            : "Out Zone",
        time: fmtTime(r.check_out),
        date: fmtDate(r.check_out),
        lat: r.check_out_latitude ?? null,
        lng: r.check_out_longitude ?? null,
      });
    }
  });

  return { data: rows, summary, error: null };
}
