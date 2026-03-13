import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  AlertCircle,
  User,
  Briefcase,
  CreditCard,
} from "lucide-react";
import type { EmployeeWithRelations } from "../../types/database.types";
import type { EmployeeFormData } from "../../lib/employeeService";
import { useEmployeeFormData } from "../../hooks/useEmployee";
import { updateAuthUserPassword } from "../../lib/adminAuthService";
import clsx from "clsx";

type Step = "personal" | "employment" | "account";

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "personal", label: "Data Pribadi", icon: <User size={14} /> },
  { key: "employment", label: "Pekerjaan", icon: <Briefcase size={14} /> },
  { key: "account", label: "Akun", icon: <CreditCard size={14} /> },
];

const EMPTY_FORM: EmployeeFormData = {
  full_name: "",
  employee_code: "",
  birth_date: "",
  gender: "",
  marital_status: "",
  national_id: "",
  phone: "",
  address: "",
  department_id: "",
  position_id: "",
  work_location_id: "",
  employment_status: "active",
  hire_date: "",
  manager_id: "",
  email: "",
  password: "",
};

type Props = {
  employee?: EmployeeWithRelations | null;
  onClose: () => void;
  onSave: (form: EmployeeFormData) => Promise<{ error: string | null }>;
  isSaving: boolean;
  saveError: string | null;
};

export default function EmployeeModal({
  employee,
  onClose,
  onSave,
  isSaving,
  saveError,
}: Props) {
  const isEdit = !!employee;
  const [step, setStep] = useState<Step>("personal");
  const [form, setForm] = useState<EmployeeFormData>(EMPTY_FORM);
  const [isResettingPwd, setIsResettingPwd] = useState(false);
  const [resetPwdSuccess, setResetPwdSuccess] = useState(false);
  const { departments, positions, workLocations, managers } =
    useEmployeeFormData();

  // Prefill form in edit mode
  useEffect(() => {
    if (employee) {
      setForm({
        full_name: employee.full_name,
        employee_code: employee.employee_code ?? "",
        birth_date: employee.birth_date ?? "",
        gender: employee.gender ?? "",
        marital_status: employee.marital_status ?? "",
        national_id: employee.national_id ?? "",
        phone: employee.phone ?? "",
        address: employee.address ?? "",
        department_id: employee.department_id ?? "",
        position_id: employee.position_id ?? "",
        work_location_id: employee.work_location_id ?? "",
        employment_status: employee.employment_status ?? "active",
        hire_date: employee.hire_date ?? "",
        manager_id: employee.manager_id ?? "",
        email: employee.users?.email ?? "",
        password: "",
      });
    }
  }, [employee]);

  const set = (field: keyof EmployeeFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);
  const isLastStep = currentStepIdx === STEPS.length - 1;

  const handleNext = () => {
    const next = STEPS[currentStepIdx + 1];
    if (next) setStep(next.key);
  };
  const handleBack = () => {
    const prev = STEPS[currentStepIdx - 1];
    if (prev) setStep(prev.key);
  };
  const handleSubmit = async () => {
    await onSave(form);
  };

  const handleResetPassword = async () => {
    if (!employee?.users?.id || !form.password) return;
    setIsResettingPwd(true);
    const { error } = await updateAuthUserPassword(
      employee.users.id,
      form.password,
    );
    setIsResettingPwd(false);
    if (!error) {
      setResetPwdSuccess(true);
      setForm((prev) => ({ ...prev, password: "" }));
      setTimeout(() => setResetPwdSuccess(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-semibold text-gray-900">
            {isEdit ? "Edit Karyawan" : "Tambah Karyawan"}
          </h3>
          <button onClick={onClose} className="btn-icon">
            <X size={16} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-6 py-4 gap-2 shrink-0 border-b border-gray-50">
          {STEPS.map((s, i) => {
            const isDone = i < currentStepIdx;
            const isCurrent = s.key === step;
            return (
              <button
                key={s.key}
                onClick={() => setStep(s.key)}
                className={clsx(
                  "flex-1 flex items-center gap-2 justify-center py-2 rounded-lg text-xs font-medium transition-all",
                  isCurrent
                    ? "bg-blue-600 text-white shadow-sm"
                    : isDone
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-gray-50 text-gray-400 border border-gray-200",
                )}
              >
                {s.icon}
                {s.label}
                {isDone && <span className="ml-0.5">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Error */}
          {saveError && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-600">{saveError}</p>
            </div>
          )}

          {/* ── Personal ── */}
          {step === "personal" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  className="input text-sm"
                  placeholder="Nama lengkap karyawan"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Kode Karyawan
                </label>
                <input
                  value={form.employee_code}
                  onChange={(e) => set("employee_code", e.target.value)}
                  className="input text-sm"
                  placeholder="e.g. EMP001"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  No. HP
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className="input text-sm"
                  placeholder="08xxxxxxxxxx"
                  type="tel"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Tanggal Lahir
                </label>
                <input
                  value={form.birth_date}
                  onChange={(e) => set("birth_date", e.target.value)}
                  className="input text-sm"
                  type="date"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                  className="select text-sm"
                >
                  <option value="">Pilih</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Status Perkawinan
                </label>
                <select
                  value={form.marital_status}
                  onChange={(e) => set("marital_status", e.target.value)}
                  className="select text-sm"
                >
                  <option value="">Pilih</option>
                  <option value="single">Belum Menikah</option>
                  <option value="married">Menikah</option>
                  <option value="divorced">Cerai</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  NIK
                </label>
                <input
                  value={form.national_id}
                  onChange={(e) => set("national_id", e.target.value)}
                  className="input text-sm"
                  placeholder="16 digit NIK"
                  maxLength={16}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Alamat
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  className="input text-sm resize-none"
                  rows={2}
                  placeholder="Alamat lengkap"
                />
              </div>
            </div>
          )}

          {/* ── Employment ── */}
          {step === "employment" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Departemen
                </label>
                <select
                  value={form.department_id}
                  onChange={(e) => set("department_id", e.target.value)}
                  className="select text-sm"
                >
                  <option value="">Pilih departemen</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Jabatan
                </label>
                <select
                  value={form.position_id}
                  onChange={(e) => set("position_id", e.target.value)}
                  className="select text-sm"
                >
                  <option value="">Pilih jabatan</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Lokasi Kerja
                </label>
                <select
                  value={form.work_location_id}
                  onChange={(e) => set("work_location_id", e.target.value)}
                  className="select text-sm"
                >
                  <option value="">Pilih lokasi</option>
                  {workLocations.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Status Kepegawaian
                </label>
                <select
                  value={form.employment_status}
                  onChange={(e) => set("employment_status", e.target.value)}
                  className="select text-sm"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                  <option value="contract">Kontrak</option>
                  <option value="probation">Probasi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Tanggal Bergabung
                </label>
                <input
                  value={form.hire_date}
                  onChange={(e) => set("hire_date", e.target.value)}
                  className="input text-sm"
                  type="date"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Atasan Langsung
                </label>
                <select
                  value={form.manager_id}
                  onChange={(e) => set("manager_id", e.target.value)}
                  className="select text-sm"
                >
                  <option value="">Tidak ada</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── Account ── */}
          {step === "account" && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 leading-relaxed">
                {isEdit
                  ? "Reset password karyawan. Karyawan perlu diberitahu password baru secara manual."
                  : "Akun ini digunakan karyawan untuk login di aplikasi mobile. Email konfirmasi tidak dikirim — karyawan langsung bisa login."}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Email
                </label>
                <input
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="input text-sm"
                  type="email"
                  placeholder="karyawan@nano.co.id"
                  required={!isEdit}
                  disabled={isEdit}
                />
                {isEdit && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Email tidak dapat diubah setelah akun dibuat.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isEdit ? "Password Baru" : "Password *"}
                </label>
                <div className="flex gap-2">
                  <input
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    className="input text-sm flex-1"
                    type="password"
                    placeholder="Min. 8 karakter"
                    minLength={isEdit ? 0 : 8}
                  />
                  {isEdit && employee?.users?.id && (
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={
                        !form.password ||
                        form.password.length < 8 ||
                        isResettingPwd
                      }
                      className="btn-secondary text-xs whitespace-nowrap"
                    >
                      {isResettingPwd ? "Mereset..." : "Reset"}
                    </button>
                  )}
                </div>
                {isEdit && !form.password && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Isi password baru lalu klik "Reset" untuk mengubah password
                    karyawan.
                  </p>
                )}
                {resetPwdSuccess && (
                  <p className="text-[11px] text-green-600 mt-1 font-medium">
                    ✓ Password berhasil direset!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={currentStepIdx === 0 ? onClose : handleBack}
            className="btn-secondary text-xs"
            disabled={isSaving}
          >
            {currentStepIdx === 0 ? "Batal" : "← Kembali"}
          </button>
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={clsx(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  i === currentStepIdx
                    ? "bg-blue-600"
                    : i < currentStepIdx
                      ? "bg-green-400"
                      : "bg-gray-200",
                )}
              />
            ))}
          </div>
          {isLastStep ? (
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="btn-primary text-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Menyimpan...
                </>
              ) : isEdit ? (
                "Simpan Perubahan"
              ) : (
                "Buat Karyawan"
              )}
            </button>
          ) : (
            <button onClick={handleNext} className="btn-primary text-xs">
              Lanjut →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
