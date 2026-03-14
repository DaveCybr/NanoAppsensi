import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalIcon,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  format,
  getDaysInMonth,
  startOfMonth,
  getDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import clsx from "clsx";

type Shift = {
  id: string;
  name: string;
  color: string;
  start_time: string;
  end_time: string;
};

type Employee = {
  id: string;
  full_name: string;
  dept_name?: string;
};

type ScheduleMap = Record<string, Record<string, string | null>>;

function ShiftPicker({
  shifts,
  current,
  onSelect,
  onClose,
  anchorRect,
}: {
  shifts: Shift[];
  current: string | null;
  onSelect: (shiftId: string | null) => void;
  onClose: () => void;
  anchorRect: DOMRect;
}) {
  // FIX 12: Use a portal-style approach with a normal-flow overlay div so
  // position:fixed doesn't collapse inside transforms/iframes. The popover
  // is positioned with inline style using viewport coords from the DOMRect.
  const top = Math.min(anchorRect.bottom + 4, window.innerHeight - 280);
  const left = Math.min(anchorRect.left, window.innerWidth - 220);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-100 min-w-[180px] overflow-hidden"
        style={{ top, left }}
      >
        <div className="p-2 space-y-0.5">
          <button
            onClick={() => {
              onSelect(null);
              onClose();
            }}
            className={clsx(
              "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors",
              current === null
                ? "bg-gray-100 font-semibold text-gray-700"
                : "text-gray-500 hover:bg-gray-50",
            )}
          >
            — Hapus jadwal
          </button>
          <button
            onClick={() => {
              onSelect("off");
              onClose();
            }}
            className={clsx(
              "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors",
              current === "off"
                ? "bg-red-50 font-semibold text-red-600"
                : "text-gray-500 hover:bg-gray-50",
            )}
          >
            🚫 Libur / Off
          </button>
          <div className="border-t border-gray-100 my-1" />
          {shifts.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onSelect(s.id);
                onClose();
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-gray-50 flex items-center gap-2"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: s.color }}
              />
              <span
                className={clsx("flex-1", current === s.id && "font-semibold")}
              >
                {s.name}
              </span>
              <span className="text-[10px] text-gray-400">
                {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default function CalendarPage() {
  const tenantId = useAuthStore((s) => s.tenant?.id);

  const [month, setMonth] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedule, setSchedule] = useState<ScheduleMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState<{
    empId: string;
    dateStr: string;
    rect: DOMRect;
  } | null>(null);
  const [filterEmp, setFilterEmp] = useState("");

  // FIX 8: Derive allDates with useMemo so it's stable for a given month
  // and can safely be used inside fetchSchedule's dependency array.
  const allDates = useMemo(() => {
    const daysInMonth = getDaysInMonth(month);
    const monthStart = startOfMonth(month);
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(monthStart);
      d.setDate(i + 1);
      return d;
    });
  }, [month]);

  const fetchBase = useCallback(async () => {
    if (!tenantId) return;
    const [shiftRes, empRes] = await Promise.all([
      supabase
        .from("shifts")
        .select("id,name,color,start_time,end_time")
        .eq("tenant_id", tenantId)
        .order("start_time"),
      supabase
        .from("employees")
        .select("id,full_name,departments(name)")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("full_name"),
    ]);
    setShifts(shiftRes.data ?? []);
    setEmployees(
      (empRes.data ?? []).map((e: any) => ({
        id: e.id,
        full_name: e.full_name,
        dept_name: e.departments?.name,
      })),
    );
  }, [tenantId]);

  // FIX 8: allDates is now in the dependency array and is stable (memoized).
  // Previously allDates was recreated every render, meaning fetchSchedule
  // could close over a stale version from a previous month.
  const fetchSchedule = useCallback(async () => {
    if (!tenantId || allDates.length === 0) return;
    setLoading(true);
    const start = format(allDates[0], "yyyy-MM-dd");
    const end = format(allDates[allDates.length - 1], "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("schedules")
      .select("employee_id, schedule_date, shift_id, is_off")
      .eq("tenant_id", tenantId)
      .gte("schedule_date", start)
      .lte("schedule_date", end);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const map: ScheduleMap = {};
    (data ?? []).forEach((row: any) => {
      if (!map[row.employee_id]) map[row.employee_id] = {};
      map[row.employee_id][row.schedule_date] = row.is_off
        ? "off"
        : row.shift_id;
    });
    setSchedule(map);
    setLoading(false);
  }, [tenantId, allDates]);

  useEffect(() => {
    fetchBase();
  }, [fetchBase]);
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleCellClick = (empId: string, date: Date, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPicker({ empId, dateStr: format(date, "yyyy-MM-dd"), rect });
  };

  const handleAssign = async (shiftIdOrOff: string | null) => {
    if (!picker || !tenantId) return;
    const { empId, dateStr } = picker;
    const key = `${empId}:${dateStr}`;
    setSaving(key);

    const payload = {
      tenant_id: tenantId,
      employee_id: empId,
      schedule_date: dateStr,
      shift_id:
        shiftIdOrOff === "off" || shiftIdOrOff === null ? null : shiftIdOrOff,
      is_off: shiftIdOrOff === "off",
    };

    if (shiftIdOrOff === null) {
      await supabase
        .from("schedules")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("employee_id", empId)
        .eq("schedule_date", dateStr);
    } else {
      await supabase
        .from("schedules")
        .upsert(payload, { onConflict: "tenant_id,employee_id,schedule_date" });
    }

    setSchedule((prev) => {
      const next = { ...prev };
      if (!next[empId]) next[empId] = {};
      if (shiftIdOrOff === null) {
        delete next[empId][dateStr];
      } else {
        next[empId] = { ...next[empId], [dateStr]: shiftIdOrOff };
      }
      return next;
    });

    setSaving(null);
  };

  const shiftById = (id: string) => shifts.find((s) => s.id === id);

  const filteredEmps = employees.filter((e) =>
    e.full_name.toLowerCase().includes(filterEmp.toLowerCase()),
  );

  const isWeekend = (d: Date) => {
    const day = getDay(d);
    return day === 0 || day === 6;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100 shrink-0 flex items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Jadwal Shift</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Klik sel untuk mengatur shift per karyawan per hari
          </p>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="btn-icon"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-sm font-semibold text-gray-800 min-w-[140px] text-center">
            {format(month, "MMMM yyyy", { locale: localeId })}
          </div>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="btn-icon"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setMonth(new Date())}
            className="btn-secondary text-xs ml-2"
          >
            Hari ini
          </button>
          <button
            onClick={fetchSchedule}
            disabled={loading}
            className="btn-icon ml-1"
          >
            <RefreshCw
              size={14}
              className={
                loading ? "animate-spin text-blue-400" : "text-gray-400"
              }
            />
          </button>
        </div>
      </div>

      <div className="px-6 py-2 border-b border-gray-50 shrink-0 flex items-center gap-4 flex-wrap">
        <span className="text-[11px] text-gray-400 font-medium">Legenda:</span>
        {shifts.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: s.color }}
            />
            <span className="text-[11px] text-gray-600">
              {s.name} ({s.start_time.slice(0, 5)})
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-200" />
          <span className="text-[11px] text-gray-600">Off/Libur</span>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2 shrink-0">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="px-6 py-2 shrink-0">
        <input
          className="input text-sm max-w-xs"
          placeholder="Filter nama karyawan..."
          value={filterEmp}
          onChange={(e) => setFilterEmp(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-6 pb-6">
          <table className="border-collapse text-xs w-max min-w-full">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-white border-b border-r border-gray-200 px-4 py-2 text-left font-semibold text-gray-600 min-w-[180px]">
                  Karyawan
                </th>
                {allDates.map((date) => (
                  <th
                    key={date.toISOString()}
                    className={clsx(
                      "border-b border-gray-200 px-2 py-2 text-center font-medium min-w-[52px]",
                      isWeekend(date)
                        ? "bg-gray-50 text-gray-400"
                        : "text-gray-600",
                      isToday(date) && "bg-blue-50 text-blue-600",
                    )}
                  >
                    <div>{format(date, "EEE", { locale: localeId })}</div>
                    <div
                      className={clsx(
                        "w-6 h-6 rounded-full flex items-center justify-center mx-auto mt-0.5 font-semibold text-[11px]",
                        isToday(date) && "bg-blue-500 text-white",
                      )}
                    >
                      {date.getDate()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmps.map((emp) => (
                <tr key={emp.id} className="group hover:bg-gray-50/50">
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50/50 border-b border-r border-gray-100 px-4 py-2">
                    <div className="font-medium text-gray-800">
                      {emp.full_name}
                    </div>
                    {emp.dept_name && (
                      <div className="text-[10px] text-gray-400">
                        {emp.dept_name}
                      </div>
                    )}
                  </td>
                  {allDates.map((date) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    const val = schedule[emp.id]?.[dateStr] ?? null;
                    const shift = val && val !== "off" ? shiftById(val) : null;
                    const isOff = val === "off";
                    const isSavingCell = saving === `${emp.id}:${dateStr}`;

                    return (
                      <td
                        key={dateStr}
                        onClick={(e) => handleCellClick(emp.id, date, e)}
                        className={clsx(
                          "border-b border-gray-100 p-1 cursor-pointer text-center relative",
                          "hover:ring-2 hover:ring-blue-300 hover:ring-inset transition-all",
                          isWeekend(date) && "bg-gray-50/60",
                          isToday(date) && "bg-blue-50/40",
                        )}
                      >
                        {isSavingCell ? (
                          <Loader2
                            size={12}
                            className="animate-spin text-gray-300 mx-auto"
                          />
                        ) : isOff ? (
                          <span className="block bg-red-100 text-red-500 rounded px-1 py-0.5 text-[10px] font-medium">
                            Off
                          </span>
                        ) : shift ? (
                          <span
                            className="block rounded px-1 py-0.5 text-[10px] font-semibold text-white truncate"
                            style={{ background: shift.color }}
                          >
                            {shift.name.length > 8
                              ? shift.name.slice(0, 7) + "…"
                              : shift.name}
                          </span>
                        ) : (
                          <span className="block text-gray-200 text-[10px]">
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {filteredEmps.length === 0 && (
                <tr>
                  <td
                    colSpan={allDates.length + 1}
                    className="py-12 text-center text-gray-400 text-sm"
                  >
                    <CalIcon size={24} className="mx-auto mb-2 text-gray-200" />
                    Tidak ada karyawan ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {picker && (
        <ShiftPicker
          shifts={shifts}
          current={schedule[picker.empId]?.[picker.dateStr] ?? null}
          onSelect={handleAssign}
          onClose={() => setPicker(null)}
          anchorRect={picker.rect}
        />
      )}
    </div>
  );
}
