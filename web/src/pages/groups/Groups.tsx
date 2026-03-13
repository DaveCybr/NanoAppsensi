// web/src/pages/groups/Groups.tsx

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  X,
  Loader2,
  AlertCircle,
  Clock,
  MapPin,
  Shield,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

// Sesuai schema: work_locations(id, name, address, latitude, longitude, ...)
type WorkLocation = {
  id: string;
  name: string;
};

type DaySchedule = {
  day_of_week: string;
  is_active: boolean;
  time_in: string; // 'HH:MM'
  time_out: string;
};

type Group = {
  id: string;
  name: string;
  work_location_id: string | null;
  work_location_name?: string;
  schedule_type: "regular" | "shift";
  tolerance_minutes: number;
  interval_minutes: number;
  timezone: string;
  mandatory_checkout: boolean;
  strict_area_in: boolean;
  strict_area_out: boolean;
  member_count: number;
  schedules: DaySchedule[];
};

const DAYS = [
  { key: "monday", short: "Mon" },
  { key: "tuesday", short: "Tue" },
  { key: "wednesday", short: "Wed" },
  { key: "thursday", short: "Thu" },
  { key: "friday", short: "Fri" },
  { key: "saturday", short: "Sat" },
  { key: "sunday", short: "Sun" },
];

const DEFAULT_SCHEDULES: DaySchedule[] = DAYS.map((d, i) => ({
  day_of_week: d.key,
  is_active: i < 6, // Mon–Sat aktif by default
  time_in: "08:00",
  time_out: "17:00",
}));

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!value)}
      className={clsx(
        "relative w-10 h-5 rounded-full cursor-pointer transition-colors shrink-0",
        value ? "bg-blue-500" : "bg-gray-300",
      )}
    >
      <div
        className={clsx(
          "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
          value ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </div>
  );
}

// ─── Group Form Modal ─────────────────────────────────────────────────────────

type FormState = Omit<Group, "id" | "work_location_name" | "member_count">;

function GroupModal({
  group,
  workLocations,
  onClose,
  onSaved,
}: {
  group: Group | null;
  workLocations: WorkLocation[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const tenantId = useAuthStore((s) => s.tenant?.id);

  const [form, setForm] = useState<FormState>(
    group ?? {
      name: "",
      work_location_id: null,
      schedule_type: "regular",
      tolerance_minutes: 15,
      interval_minutes: 60,
      timezone: "Asia/Jakarta",
      mandatory_checkout: false,
      strict_area_in: false,
      strict_area_out: false,
      schedules: DEFAULT_SCHEDULES,
    },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDay = (idx: number, field: keyof DaySchedule, val: any) =>
    setForm((f) => {
      const schedules = [...f.schedules];
      schedules[idx] = { ...schedules[idx], [field]: val };
      return { ...f, schedules };
    });

  const handleSave = async () => {
    if (!form.name.trim()) return setError("Nama group wajib diisi");
    if (!tenantId) return;
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      work_location_id: form.work_location_id,
      schedule_type: form.schedule_type,
      tolerance_minutes: form.tolerance_minutes,
      interval_minutes: form.interval_minutes,
      timezone: form.timezone,
      mandatory_checkout: form.mandatory_checkout,
      strict_area_in: form.strict_area_in,
      strict_area_out: form.strict_area_out,
      tenant_id: tenantId,
    };

    let groupId = group?.id;

    if (group) {
      const { error } = await supabase
        .from("groups")
        .update(payload)
        .eq("id", group.id);
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("groups")
        .insert(payload)
        .select("id")
        .single();
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
      groupId = data.id;
    }

    // Upsert group_schedules
    const scheduleRows = form.schedules.map((s) => ({
      group_id: groupId!,
      tenant_id: tenantId,
      day_of_week: s.day_of_week,
      is_active: s.is_active,
      time_in: s.is_active ? s.time_in : null,
      time_out: s.is_active ? s.time_out : null,
    }));

    const { error: schedErr } = await supabase
      .from("group_schedules")
      .upsert(scheduleRows, { onConflict: "group_id,day_of_week" });

    if (schedErr) {
      setError(schedErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">
            {group ? "Edit Group" : "Add Group"}
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Group Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                className="input mt-1"
                placeholder="cth: Produksi, Marketing..."
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Work Location (Zone)</label>
              <select
                className="input mt-1"
                value={form.work_location_id ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    work_location_id: e.target.value || null,
                  }))
                }
              >
                <option value="">All Zones</option>
                {workLocations.map((wl) => (
                  <option key={wl.id} value={wl.id}>
                    {wl.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">
                Schedule Type <span className="text-red-500">*</span>
              </label>
              <select
                className="input mt-1"
                value={form.schedule_type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    schedule_type: e.target.value as any,
                  }))
                }
              >
                <option value="regular">Regular</option>
                <option value="shift">Shift</option>
              </select>
            </div>
          </div>

          {/* Lock Attendance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-800">
                  Lock Time Attendance
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Users will be recorded as absent if they don't check out
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Toggle
                  value={form.mandatory_checkout}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, mandatory_checkout: v }))
                  }
                />
                <span className="text-sm text-gray-600">
                  Mandatory Checkout
                </span>
              </label>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-800">
                  Lock Location Attendance
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Users cannot check-in or check-out outside the location
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Toggle
                  value={form.strict_area_in}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, strict_area_in: v }))
                  }
                />
                <span className="text-sm text-gray-600">Strict Area In</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Toggle
                  value={form.strict_area_out}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, strict_area_out: v }))
                  }
                />
                <span className="text-sm text-gray-600">Strict Area Out</span>
              </label>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">
              Schedule
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <label className="label">
                  Tolerance in Minutes <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  className="input mt-1"
                  value={form.tolerance_minutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      tolerance_minutes: +e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="label">
                  Interval in Minutes <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  className="input mt-1"
                  value={form.interval_minutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      interval_minutes: +e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="label">
                  Timezone <span className="text-red-500">*</span>
                </label>
                <select
                  className="input mt-1"
                  value={form.timezone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, timezone: e.target.value }))
                  }
                >
                  <option value="Asia/Jakarta">WIB (UTC+7)</option>
                  <option value="Asia/Makassar">WITA (UTC+8)</option>
                  <option value="Asia/Jayapura">WIT (UTC+9)</option>
                </select>
              </div>
            </div>

            {/* Schedule In */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Schedule In
              </div>
              <div className="grid grid-cols-7 gap-2">
                {form.schedules.map((s, i) => (
                  <div
                    key={s.day_of_week}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => setDay(i, "is_active", !s.is_active)}
                      className={clsx(
                        "text-[11px] font-semibold w-full py-0.5 rounded transition-colors",
                        s.is_active
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-400",
                      )}
                    >
                      {DAYS[i].short}
                    </button>
                    <input
                      type="time"
                      disabled={!s.is_active}
                      value={s.time_in}
                      onChange={(e) => setDay(i, "time_in", e.target.value)}
                      className={clsx(
                        "input text-[11px] px-1 py-1 text-center w-full",
                        !s.is_active && "opacity-30 cursor-not-allowed",
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Out */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Schedule Out
              </div>
              <div className="grid grid-cols-7 gap-2">
                {form.schedules.map((s, i) => (
                  <div
                    key={s.day_of_week}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={clsx(
                        "text-[11px] font-semibold w-full py-0.5 rounded text-center",
                        s.is_active
                          ? "bg-gray-100 text-gray-600"
                          : "bg-gray-50 text-gray-300",
                      )}
                    >
                      {DAYS[i].short}
                    </div>
                    <input
                      type="time"
                      disabled={!s.is_active}
                      value={s.time_out}
                      onChange={(e) => setDay(i, "time_out", e.target.value)}
                      className={clsx(
                        "input text-[11px] px-1 py-1 text-center w-full",
                        !s.is_active && "opacity-30 cursor-not-allowed",
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Groups() {
  const tenantId = useAuthStore((s) => s.tenant?.id);

  const [groups, setGroups] = useState<Group[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Group | null>(null);

  const fetchAll = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);

    const [groupRes, locRes] = await Promise.all([
      supabase
        .from("groups")
        .select(
          `
          id, name, work_location_id, schedule_type,
          tolerance_minutes, interval_minutes, timezone,
          mandatory_checkout, strict_area_in, strict_area_out,
          work_locations ( name ),
          group_schedules ( day_of_week, is_active, time_in, time_out )
        `,
        )
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("name"),

      // Sesuai schema: work_locations
      supabase
        .from("work_locations")
        .select("id, name")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("name"),
    ]);

    if (groupRes.error) {
      setError(groupRes.error.message);
      setLoading(false);
      return;
    }

    setGroups(
      (groupRes.data ?? []).map((g: any) => ({
        id: g.id,
        name: g.name,
        work_location_id: g.work_location_id,
        work_location_name: g.work_locations?.name,
        schedule_type: g.schedule_type,
        tolerance_minutes: g.tolerance_minutes,
        interval_minutes: g.interval_minutes,
        timezone: g.timezone,
        mandatory_checkout: g.mandatory_checkout,
        strict_area_in: g.strict_area_in,
        strict_area_out: g.strict_area_out,
        member_count: 0,
        schedules: DAYS.map((d) => {
          const found = (g.group_schedules ?? []).find(
            (s: any) => s.day_of_week === d.key,
          );
          return (
            found ?? {
              day_of_week: d.key,
              is_active: false,
              time_in: "08:00",
              time_out: "17:00",
            }
          );
        }),
      })),
    );

    setWorkLocations(locRes.data ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDelete = async (g: Group) => {
    if (!confirm(`Hapus group "${g.name}"?`)) return;
    // Soft delete
    await supabase
      .from("groups")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", g.id);
    fetchAll();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Group</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Kelola unit organisasi dan jadwal absensi
          </p>
        </div>
        <button
          onClick={() => {
            setSelected(null);
            setModal("create");
          }}
          className="btn-primary"
        >
          <Plus size={14} /> Add Group
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2 mb-6">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={22} className="animate-spin text-gray-300" />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
          <Users size={26} className="text-gray-300 mb-2" />
          <p className="text-sm">Belum ada group</p>
          <p className="text-xs mt-0.5">Klik "Add Group" untuk memulai</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((g) => {
            const firstActive = g.schedules.find((s) => s.is_active);
            return (
              <div
                key={g.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5"
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Users size={18} className="text-blue-500" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {g.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin size={10} />
                        {g.work_location_name ?? "All Zones"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setSelected(g);
                        setModal("edit");
                      }}
                      className="btn-icon"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(g)}
                      className="btn-icon text-red-400 hover:bg-red-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Active days */}
                <div className="flex gap-1 mb-3">
                  {DAYS.map((d) => {
                    const active = g.schedules.find(
                      (s) => s.day_of_week === d.key,
                    )?.is_active;
                    return (
                      <span
                        key={d.key}
                        className={clsx(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded",
                          active
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-300",
                        )}
                      >
                        {d.short}
                      </span>
                    );
                  })}
                </div>

                {/* Schedule summary */}
                {firstActive && (
                  <div className="text-xs text-gray-500 flex items-center gap-1.5 mb-3">
                    <Clock size={11} className="text-gray-400" />
                    {firstActive.time_in} – {firstActive.time_out}
                    <span className="text-gray-300">·</span>
                    Toleransi {g.tolerance_minutes} mnt
                  </div>
                )}

                {/* Policy badges */}
                <div className="flex flex-wrap gap-1 mb-3 min-h-[20px]">
                  {g.mandatory_checkout && (
                    <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock size={9} />
                      Mandatory Checkout
                    </span>
                  )}
                  {g.strict_area_in && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Shield size={9} />
                      Strict In
                    </span>
                  )}
                  {g.strict_area_out && (
                    <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Shield size={9} />
                      Strict Out
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Users size={12} />
                    {g.member_count} karyawan
                  </span>
                  <span className="text-[11px] text-gray-400 capitalize">
                    {g.schedule_type}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <GroupModal
          group={modal === "edit" ? selected : null}
          workLocations={workLocations}
          onClose={() => setModal(null)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
}
