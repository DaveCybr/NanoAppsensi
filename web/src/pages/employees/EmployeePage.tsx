import { useState } from "react";
import {
  UserPlus,
  Download,
  RefreshCw,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react";
import { useEmployeeList, useEmployeeMutations } from "../../hooks/useEmployee";
import type { EmployeeWithRelations } from "../../lib/employeeService";
import type { EmployeeFormData } from "../../lib/employeeService";
import EmployeeModal from "./EmployeeModal";
import clsx from "clsx";

export default function EmployeePage() {
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<EmployeeWithRelations | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] =
    useState<EmployeeWithRelations | null>(null);

  const {
    employees,
    totalCount,
    isLoading,
    error,
    filters,
    setFilter,
    refetch,
  } = useEmployeeList();

  const {
    create,
    update,
    remove,
    toggleActive,
    isSaving,
    isDeleting,
    saveError,
    setSaveError,
  } = useEmployeeMutations(refetch);

  const handleSearch = () => setFilter({ search: searchInput, page: 1 });
  const handleStatusFilter = (val: typeof statusFilter) => {
    setStatusFilter(val);
    setFilter({
      isActive: val === "all" ? undefined : val === "active",
      page: 1,
    });
  };
  const openCreate = () => {
    setEditTarget(null);
    setSaveError(null);
    setShowModal(true);
  };
  const openEdit = (emp: EmployeeWithRelations) => {
    setEditTarget(emp);
    setSaveError(null);
    setShowModal(true);
  };

  const handleSave = async (
    form: EmployeeFormData,
  ): Promise<{ error: string | null }> => {
    const result = editTarget
      ? await update(editTarget.id, form)
      : await create(form);
    if (!result.error) setShowModal(false);
    return result;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await remove(deleteTarget.id);
    if (!error) setDeleteTarget(null);
  };

  const totalPages = Math.ceil(totalCount / (filters.perPage ?? 10));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Employee</h1>
        <button onClick={refetch} className="btn-icon" title="Refresh">
          <RefreshCw
            size={15}
            className={
              isLoading ? "animate-spin text-blue-500" : "text-gray-400"
            }
          />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <button onClick={openCreate} className="btn-primary text-xs">
            <UserPlus size={14} /> Add Karyawan
          </button>
          <button className="btn-secondary text-xs">
            <Download size={14} /> Download
          </button>
          <div className="flex items-center gap-2 ml-2 text-xs text-gray-500">
            <span>
              Total: <strong className="text-gray-700">{totalCount}</strong>
            </span>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Cari nama atau kode..."
              className="input pl-8 w-52 text-xs"
            />
          </div>
          <button onClick={handleSearch} className="btn-secondary text-xs">
            Cari
          </button>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden ml-auto">
            {(["all", "active", "inactive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusFilter(s)}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === s
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50",
                )}
              >
                {s === "all" ? "Semua" : s === "active" ? "Aktif" : "Nonaktif"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Kode</th>
                <th className="table-th">Nama Karyawan</th>
                <th className="table-th">Departemen</th>
                <th className="table-th">Jabatan</th>
                <th className="table-th">Lokasi</th>
                <th className="table-th">Status</th>
                <th className="table-th">Aktif</th>
                <th className="table-th">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Loader2
                      size={20}
                      className="animate-spin text-blue-400 mx-auto"
                    />
                  </td>
                </tr>
              )}
              {!isLoading && employees.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-sm text-gray-400"
                  >
                    {filters.search
                      ? `Tidak ada hasil untuk "${filters.search}"`
                      : "Belum ada karyawan"}
                  </td>
                </tr>
              )}
              {!isLoading &&
                employees.map((emp) => (
                  <tr key={emp.id} className="table-tr-hover">
                    <td className="table-td text-xs font-mono text-gray-400">
                      {emp.employee_code ?? "—"}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0 overflow-hidden">
                          {emp.photo_url ? (
                            <img
                              src={emp.photo_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-[10px] font-bold">
                              {emp.full_name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-800">
                            {emp.full_name}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {emp.users?.email ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-td text-xs text-gray-600">
                      {emp.departments?.name ?? (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="table-td text-xs text-gray-600">
                      {emp.positions?.name ?? (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="table-td text-xs text-gray-600">
                      {emp.work_locations?.name ?? (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="table-td">
                      <span
                        className={clsx(
                          "badge text-xs",
                          emp.employment_status === "active"
                            ? "badge-success"
                            : emp.employment_status === "probation"
                              ? "badge-info"
                              : emp.employment_status === "contract"
                                ? "badge-warning"
                                : "badge-gray",
                        )}
                      >
                        {emp.employment_status ?? "—"}
                      </span>
                    </td>
                    <td className="table-td">
                      {/* FIX 10: toggleActive now accepts string | undefined safely */}
                      <button
                        onClick={() =>
                          toggleActive(
                            emp.users?.id,
                            !(emp.users?.is_active ?? false),
                          )
                        }
                        className={clsx(
                          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                          emp.users?.is_active ? "bg-green-500" : "bg-gray-200",
                        )}
                      >
                        <span
                          className={clsx(
                            "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                            emp.users?.is_active
                              ? "translate-x-4"
                              : "translate-x-0.5",
                          )}
                        />
                      </button>
                    </td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(emp)}
                          className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        >
                          <Edit size={12} className="text-blue-500" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(emp)}
                          className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                        >
                          <Trash2 size={12} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Per halaman:</span>
            <select
              value={filters.perPage}
              onChange={(e) =>
                setFilter({ perPage: Number(e.target.value), page: 1 })
              }
              className="select text-xs w-16"
            >
              {[10, 25, 50].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>
              {((filters.page ?? 1) - 1) * (filters.perPage ?? 10) + 1}–
              {Math.min(
                (filters.page ?? 1) * (filters.perPage ?? 10),
                totalCount,
              )}{" "}
              dari {totalCount}
            </span>
            <button
              onClick={() => setFilter({ page: 1 })}
              disabled={(filters.page ?? 1) === 1}
              className="btn-icon"
            >
              «
            </button>
            <button
              onClick={() => setFilter({ page: (filters.page ?? 1) - 1 })}
              disabled={(filters.page ?? 1) === 1}
              className="btn-icon"
            >
              ‹
            </button>
            <button
              onClick={() => setFilter({ page: (filters.page ?? 1) + 1 })}
              disabled={(filters.page ?? 1) === totalPages}
              className="btn-icon"
            >
              ›
            </button>
            <button
              onClick={() => setFilter({ page: totalPages })}
              disabled={(filters.page ?? 1) === totalPages}
              className="btn-icon"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <EmployeeModal
          employee={editTarget}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          isSaving={isSaving}
          saveError={saveError}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Hapus Karyawan?
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              <strong className="text-gray-700">
                {deleteTarget.full_name}
              </strong>{" "}
              akan dinonaktifkan (soft delete). Data absensi tetap tersimpan.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary text-xs"
                disabled={isDeleting}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger text-xs"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Menghapus...
                  </>
                ) : (
                  "Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
