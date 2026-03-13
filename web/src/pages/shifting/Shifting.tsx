// web/src/pages/shifting/Shifting.tsx
// Halaman manajemen shift kerja — CRUD shifts + assign ke karyawan

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  Users,
  ChevronRight,
  Sun,
  Moon,
  Sunset,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

type Shift = {
  id: string;
  name: string;
  start_time: string; // 'HH:MM:SS'
  end_time: string;
  late_tolerance: number; // menit
  work_days: string[];
  color: string;
  employee_count?: number;
};

type Employee = {
  id: string;
  full_name: string;
  department?: { name: string };
};

const DAY_LABELS: Record<string, string> = {
  Monday: "Sen",
  Tuesday: "Sel",
  Wednesday: "Rab",
  Thursday: "Kam",
  Friday: "Jum",
  Saturday: "Sab",
  Sunday: "Min",
};

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SHIFT_COLORS = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#be185d",
  "#059669",
];

// ─── Utils ────────────────────────────────────────────────────────────────────

function fmtTime(t: string) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function shiftIcon(startTime: string) {
  const h = parseInt(startTime?.split(":")[0] ?? "8");
  if (h < 12) return <Sun size={16} className="text-amber-500" />;
  if (h < 17) return <Sunset size={16} className="text-orange-400" />;
  return <Moon size={16} className="text-indigo-400" />;
}

// ─── Shift Form ───────────────────────────────────────────────────────────────

type ShiftFormData = Omit<Shift, "id" | "employee_count">;

const defaultForm: ShiftFormData = {
  name: "",
  start_time: "08:00",
  end_time: "17:00",
  late_tolerance: 15,
  work_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  color: "#2563eb",
};

function ShiftModal({
  shift,
  onClose,
  onSaved,
}: {
  shift: Shift | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const tenantId = useAuthStore((s) => s.tenant?.id);
  const [form, setForm] = useState<ShiftFormData>(
    shift
      ? {
          name: shift.name,
          start_time: shift.start_time.slice(0, 5),
          end_time: shift.end_time.slice(0, 5),
          late_tolerance: shift.late_tolerance,
          work_days: shift.work_days,
          color: shift.color,
        }
      : defaultForm,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (day: string) => {
    setForm((f) => ({
      ...f,
      work_days: f.work_days.includes(day)
        ? f.work_days.filter((d) => d !== day)
        : [...f.work_days, day],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setError("Nama shift wajib diisi");
    if (!form.work_days.length) return setError("Pilih minimal 1 hari kerja");
    if (!tenantId) return setError("Tenant tidak ditemukan");
    setSaving(true);
    setError(null);
    const payload = { ...form, tenant_id: tenantId };
    const { error } = shift
      ? await supabase.from("shifts").update(payload).eq("id", shift.id)
      : await supabase.from("shifts").insert(payload);
    setSaving(false);
    if (error) return setError(error.message);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: form.color + "20" }}
            >
              <Clock size={18} style={{ color: form.color }} />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {shift ? "Edit Shift" : "Tambah Shift"}
            </h2>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Nama */}
          <div>
            <label className="label">Nama Shift</label>
            <input
              className="input mt-1"
              placeholder="cth: Shift Pagi, Normal, Shift Malam..."
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Jam */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Jam Masuk</label>
              <input
                type="time"
                className="input mt-1"
                value={form.start_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_time: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Jam Keluar</label>
              <input
                type="time"
                className="input mt-1"
                value={form.end_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_time: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Toleransi */}
          <div>
            <label className="label">Toleransi Terlambat (menit)</label>
            <input
              type="number"
              min={0}
              max={60}
              className="input mt-1"
              value={form.late_tolerance}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  late_tolerance: parseInt(e.target.value) || 0,
                }))
              }
            />
          </div>

          {/* Hari kerja */}
          <div>
            <label className="label mb-2 block">Hari Kerja</label>
            <div className="flex gap-1.5 flex-wrap">
              {ALL_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    form.work_days.includes(day)
                      ? "text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  )}
                  style={
                    form.work_days.includes(day)
                      ? { background: form.color }
                      : {}
                  }
                >
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>
          </div>

          {/* Warna */}
          <div>
            <label className="label mb-2 block">Warna</label>
            <div className="flex gap-2">
              {SHIFT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    background: c,
                    borderColor: form.color === c ? "white" : c,
                    boxShadow: form.color === c ? `0 0 0 2px ${c}` : "none",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="btn-secondary">
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assign Employees Modal ───────────────────────────────────────────────────

function AssignModal({
  shift,
  onClose,
}: {
  shift: Shift;
  onClose: () => void;
}) {
  const tenantId = useAuthStore((s) => s.tenant?.id);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    Promise.all([
      supabase
        .from("employees")
        .select("id, full_name, departments(name)")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("full_name"),
      supabase
        .from("employee_shifts")
        .select("employee_id")
        .eq("shift_id", shift.id)
        .eq("tenant_id", tenantId),
    ]).then(([empRes, assignRes]) => {
      setEmployees(
        (empRes.data ?? []).map((e: any) => ({
          id: e.id,
          full_name: e.full_name,
          department: e.departments,
        })),
      );
      setAssignedIds(
        new Set((assignRes.data ?? []).map((r: any) => r.employee_id)),
      );
      setLoading(false);
    });
  }, [tenantId, shift.id]);

  const toggle = (id: string) => {
    setAssignedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    // Delete existing, then insert selected
    await supabase
      .from("employee_shifts")
      .delete()
      .eq("shift_id", shift.id)
      .eq("tenant_id", tenantId);
    if (assignedIds.size > 0) {
      await supabase.from("employee_shifts").insert(
        [...assignedIds].map((emp_id) => ({
          shift_id: shift.id,
          employee_id: emp_id,
          tenant_id: tenantId,
          start_date: new Date().toISOString().slice(0, 10),
        })),
      );
    }
    setSaving(false);
    onClose();
  };

  const filtered = employees.filter((e) =>
    e.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Assign Karyawan
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Shift:{" "}
              <span style={{ color: shift.color }} className="font-medium">
                {shift.name}
              </span>
              &nbsp;· {assignedIds.size} dipilih
            </p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-50 shrink-0">
          <input
            className="input text-sm"
            placeholder="Cari nama karyawan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading && (
            <div className="flex items-center justify-center h-20">
              <Loader2 size={20} className="animate-spin text-gray-300" />
            </div>
          )}
          {!loading &&
            filtered.map((emp) => {
              const checked = assignedIds.has(emp.id);
              return (
                <button
                  key={emp.id}
                  onClick={() => toggle(emp.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 text-left"
                >
                  <div
                    className={clsx(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                      checked ? "border-transparent" : "border-gray-300",
                    )}
                    style={checked ? { background: shift.color } : {}}
                  >
                    {checked && (
                      <CheckCircle2 size={12} className="text-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {emp.full_name}
                    </div>
                    {emp.department && (
                      <div className="text-[11px] text-gray-400">
                        {(emp.department as any).name}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-5 pt-4 border-t border-gray-100 shrink-0">
          <span className="text-xs text-gray-400">
            {filtered.length} karyawan
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary">
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Shifting() {
  const tenantId = useAuthStore((s) => s.tenant?.id);

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | "assign" | null>(null);
  const [selected, setSelected] = useState<Shift | null>(null);

  const fetchShifts = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("shifts")
      .select(
        `
        id, name, start_time, end_time, late_tolerance, work_days, color,
        employee_shifts ( employee_id )
      `,
      )
      .eq("tenant_id", tenantId)
      .order("start_time");

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setShifts(
      (data ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        start_time: s.start_time,
        end_time: s.end_time,
        late_tolerance: s.late_tolerance ?? 15,
        work_days: s.work_days ?? [],
        color: s.color ?? "#2563eb",
        employee_count: (s.employee_shifts ?? []).length,
      })),
    );
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const handleDelete = async (shift: Shift) => {
    if (
      !confirm(
        `Hapus shift "${shift.name}"? Semua assignment shift ini akan terhapus.`,
      )
    )
      return;
    await supabase.from("shifts").delete().eq("id", shift.id);
    fetchShifts();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Shifting</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Kelola jadwal shift dan assignment karyawan
          </p>
        </div>
        <button
          onClick={() => {
            setSelected(null);
            setModal("create");
          }}
          className="btn-primary"
        >
          <Plus size={15} />
          Tambah Shift
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-6 flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      )}

      {/* Empty */}
      {!loading && shifts.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Clock size={28} className="text-gray-300 mb-2" />
          <p className="text-sm">Belum ada shift</p>
          <p className="text-xs mt-0.5">Klik "Tambah Shift" untuk memulai</p>
        </div>
      )}

      {/* Shift cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {shifts.map((shift) => (
          <div
            key={shift.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            {/* Color bar */}
            <div className="h-1.5 w-full" style={{ background: shift.color }} />

            <div className="p-5">
              {/* Title row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: shift.color + "18" }}
                  >
                    {shiftIcon(shift.start_time)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {shift.name}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {fmtTime(shift.start_time)} – {fmtTime(shift.end_time)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelected(shift);
                      setModal("edit");
                    }}
                    className="btn-icon"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(shift)}
                    className="btn-icon text-red-400 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Work days */}
              <div className="flex gap-1 mb-4 flex-wrap">
                {ALL_DAYS.map((day) => (
                  <span
                    key={day}
                    className={clsx(
                      "text-[10px] font-medium px-2 py-0.5 rounded-md",
                      shift.work_days.includes(day)
                        ? "text-white"
                        : "bg-gray-100 text-gray-300",
                    )}
                    style={
                      shift.work_days.includes(day)
                        ? { background: shift.color }
                        : {}
                    }
                  >
                    {DAY_LABELS[day]}
                  </span>
                ))}
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock size={12} className="text-gray-400" />
                  <span>Toleransi {shift.late_tolerance} mnt</span>
                </div>
                <button
                  onClick={() => {
                    setSelected(shift);
                    setModal("assign");
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity"
                  style={{ color: shift.color }}
                >
                  <Users size={13} />
                  {shift.employee_count} karyawan
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {(modal === "create" || modal === "edit") && (
        <ShiftModal
          shift={modal === "edit" ? selected : null}
          onClose={() => setModal(null)}
          onSaved={fetchShifts}
        />
      )}
      {modal === "assign" && selected && (
        <AssignModal
          shift={selected}
          onClose={() => {
            setModal(null);
            fetchShifts();
          }}
        />
      )}
    </div>
  );
}
