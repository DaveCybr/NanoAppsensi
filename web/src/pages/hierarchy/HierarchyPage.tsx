// web/src/pages/hierarchy/HierarchyPage.tsx
// Schema aktual:
//   positions:           id, tenant_id, name, description
//   employment_statuses: id, tenant_id, code, name
//   grades:              id, tenant_id, code, name

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Search,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

type Position = {
  id: string;
  name: string;
  description: string | null;
};

type EmpStatus = {
  id: string;
  code: string;
  name: string;
};

type Grade = {
  id: string;
  code: string;
  name: string;
};

type Tab = "position" | "employment_status" | "grade";

// ─── Modals ───────────────────────────────────────────────────────────────────

function PositionModal({
  item,
  tenantId,
  onClose,
  onSaved,
}: {
  item: Position | null;
  tenantId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [desc, setDesc] = useState(item?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) return setError("Position Name wajib diisi");
    setSaving(true);
    setError(null);
    const payload = { name, description: desc || null, tenant_id: tenantId };
    const { error } = item
      ? await supabase.from("positions").update(payload).eq("id", item.id)
      : await supabase.from("positions").insert(payload);
    setSaving(false);
    if (error) return setError(error.message);
    onSaved();
    onClose();
  };

  return (
    <ModalWrapper
      title={item ? "Edit Position" : "Add Position"}
      onClose={onClose}
    >
      {error && <ErrorBox msg={error} />}
      <div>
        <label className="label">
          Position Name <span className="text-red-500">*</span>
        </label>
        <input
          className="input mt-1"
          placeholder="cth: Staff, Supervisor, Manager..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Description</label>
        <input
          className="input mt-1"
          placeholder="Opsional..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} />
    </ModalWrapper>
  );
}

function EmpStatusModal({
  item,
  tenantId,
  onClose,
  onSaved,
}: {
  item: EmpStatus | null;
  tenantId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [code, setCode] = useState(item?.code ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!code.trim()) return setError("Code wajib diisi");
    if (!name.trim()) return setError("Name wajib diisi");
    setSaving(true);
    setError(null);
    const payload = { code, name, tenant_id: tenantId };
    const { error } = item
      ? await supabase
          .from("employment_statuses")
          .update(payload)
          .eq("id", item.id)
      : await supabase.from("employment_statuses").insert(payload);
    setSaving(false);
    if (error) return setError(error.message);
    onSaved();
    onClose();
  };

  return (
    <ModalWrapper
      title={item ? "Edit Employment Status" : "Add Employment Status"}
      onClose={onClose}
    >
      {error && <ErrorBox msg={error} />}
      <div>
        <label className="label">
          Code <span className="text-red-500">*</span>
        </label>
        <input
          className="input mt-1"
          placeholder="cth: PERMANENT, PKWT, INTERNSHIP..."
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
      </div>
      <div>
        <label className="label">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          className="input mt-1"
          placeholder="cth: Tetap, PKWT, Magang..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} />
    </ModalWrapper>
  );
}

function GradeModal({
  item,
  tenantId,
  onClose,
  onSaved,
}: {
  item: Grade | null;
  tenantId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [code, setCode] = useState(item?.code ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!code.trim()) return setError("Code wajib diisi");
    if (!name.trim()) return setError("Name wajib diisi");
    setSaving(true);
    setError(null);
    const payload = { code, name, tenant_id: tenantId };
    const { error } = item
      ? await supabase.from("grades").update(payload).eq("id", item.id)
      : await supabase.from("grades").insert(payload);
    setSaving(false);
    if (error) return setError(error.message);
    onSaved();
    onClose();
  };

  return (
    <ModalWrapper title={item ? "Edit Grade" : "Add Grade"} onClose={onClose}>
      {error && <ErrorBox msg={error} />}
      <div>
        <label className="label">
          Code <span className="text-red-500">*</span>
        </label>
        <input
          className="input mt-1"
          placeholder="cth: G1, G2, EXEC..."
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
      </div>
      <div>
        <label className="label">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          className="input mt-1"
          placeholder="cth: Grade 1, Executive..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} />
    </ModalWrapper>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function ModalWrapper({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="btn-icon">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <button onClick={onClose} className="btn-secondary">
        Cancel
      </button>
      <button onClick={onSave} disabled={saving} className="btn-primary">
        {saving ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <CheckCircle2 size={13} />
        )}
        Save
      </button>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-2">
      <AlertCircle size={13} />
      {msg}
    </div>
  );
}

function DataTable({
  columns,
  rows,
  onEdit,
  onDelete,
  loading,
}: {
  columns: { key: string; label: string }[];
  rows: Record<string, any>[];
  onEdit: (row: any) => void;
  onDelete: (row: any) => void;
  loading: boolean;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-12">
              No
            </th>
            {columns.map((c) => (
              <th
                key={c.key}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500"
              >
                {c.label}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 w-24">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length + 2} className="py-12 text-center">
                <Loader2
                  size={20}
                  className="animate-spin text-gray-300 mx-auto"
                />
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + 2}
                className="py-12 text-center text-sm text-gray-400"
              >
                Belum ada data
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((row, i) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
              >
                <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-gray-700">
                    {row[c.key] ?? "—"}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(row)}
                      className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(row)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HierarchyPage() {
  const tenantId = useAuthStore((s) => s.tenant?.id);

  const [tab, setTab] = useState<Tab>("position");
  const [positions, setPositions] = useState<Position[]>([]);
  const [statuses, setStatuses] = useState<EmpStatus[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  type ModalType =
    | "pos-create"
    | "pos-edit"
    | "stat-create"
    | "stat-edit"
    | "grade-create"
    | "grade-edit"
    | null;
  const [modal, setModal] = useState<ModalType>(null);
  const [selPos, setSelPos] = useState<Position | null>(null);
  const [selStat, setSelStat] = useState<EmpStatus | null>(null);
  const [selGrade, setSelGrade] = useState<Grade | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("positions")
      .select("id, name, description")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("name");
    if (error) setError(error.message);
    else setPositions(data ?? []);
    setLoading(false);
  }, [tenantId]);

  const fetchStatuses = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("employment_statuses")
      .select("id, code, name")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("name");
    if (error) setError(error.message);
    else setStatuses(data ?? []);
    setLoading(false);
  }, [tenantId]);

  const fetchGrades = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("grades")
      .select("id, code, name")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("code");
    if (error) setError(error.message);
    else setGrades(data ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    setSearch("");
    if (tab === "position") fetchPositions();
    else if (tab === "employment_status") fetchStatuses();
    else fetchGrades();
  }, [tab]);

  // Soft delete helpers
  const deletePos = async (p: Position) => {
    if (!confirm(`Hapus position "${p.name}"?`)) return;
    await supabase
      .from("positions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", p.id);
    fetchPositions();
  };
  const deleteStat = async (s: EmpStatus) => {
    if (!confirm(`Hapus status "${s.name}"?`)) return;
    await supabase
      .from("employment_statuses")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", s.id);
    fetchStatuses();
  };
  const deleteGrade = async (g: Grade) => {
    if (!confirm(`Hapus grade "${g.name}"?`)) return;
    await supabase
      .from("grades")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", g.id);
    fetchGrades();
  };

  // Filtered data
  const filteredPos = positions.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );
  const filteredStat = statuses.filter(
    (s) =>
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredGrade = grades.filter(
    (g) =>
      g.code.toLowerCase().includes(search.toLowerCase()) ||
      g.name.toLowerCase().includes(search.toLowerCase()),
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "position", label: "Position" },
    { key: "employment_status", label: "Employment Status" },
    { key: "grade", label: "Grade" },
  ];

  const addLabel =
    tab === "position"
      ? "Add Position"
      : tab === "employment_status"
        ? "Add Status"
        : "Add Grade";

  const handleAdd = () => {
    if (tab === "position") setModal("pos-create");
    else if (tab === "employment_status") setModal("stat-create");
    else setModal("grade-create");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Hierarchy</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Kelola jabatan, grade, dan status kepegawaian
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              tab === t.key
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2 mb-4">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="input pl-9 text-sm w-64"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={handleAdd} className="btn-primary">
          <Plus size={14} />
          {addLabel}
        </button>
      </div>

      {/* Tables */}
      {tab === "position" && (
        <DataTable
          loading={loading}
          columns={[
            { key: "name", label: "Position Name" },
            { key: "description", label: "Description" },
          ]}
          rows={filteredPos}
          onEdit={(row) => {
            setSelPos(row);
            setModal("pos-edit");
          }}
          onDelete={deletePos}
        />
      )}

      {tab === "employment_status" && (
        <DataTable
          loading={loading}
          columns={[
            { key: "code", label: "Code" },
            { key: "name", label: "Name" },
          ]}
          rows={filteredStat}
          onEdit={(row) => {
            setSelStat(row);
            setModal("stat-edit");
          }}
          onDelete={deleteStat}
        />
      )}

      {tab === "grade" && (
        <DataTable
          loading={loading}
          columns={[
            { key: "code", label: "Code" },
            { key: "name", label: "Name" },
          ]}
          rows={filteredGrade}
          onEdit={(row) => {
            setSelGrade(row);
            setModal("grade-edit");
          }}
          onDelete={deleteGrade}
        />
      )}

      {/* Modals */}
      {(modal === "pos-create" || modal === "pos-edit") && tenantId && (
        <PositionModal
          item={modal === "pos-edit" ? selPos : null}
          tenantId={tenantId}
          onClose={() => setModal(null)}
          onSaved={fetchPositions}
        />
      )}
      {(modal === "stat-create" || modal === "stat-edit") && tenantId && (
        <EmpStatusModal
          item={modal === "stat-edit" ? selStat : null}
          tenantId={tenantId}
          onClose={() => setModal(null)}
          onSaved={fetchStatuses}
        />
      )}
      {(modal === "grade-create" || modal === "grade-edit") && tenantId && (
        <GradeModal
          item={modal === "grade-edit" ? selGrade : null}
          tenantId={tenantId}
          onClose={() => setModal(null)}
          onSaved={fetchGrades}
        />
      )}
    </div>
  );
}
