"use client"

import React, { useState, useEffect } from 'react'
import { X, User, Briefcase, ShieldCheck, ChevronRight, ChevronLeft, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useApi } from '@/hooks/useApi'

interface EmployeeDrawerProps {
  isOpen:    boolean
  onClose:   () => void
  onSuccess: () => void
  employee?: any
}

const STEPS = [
  { id: 1, label: 'Data Pribadi',  icon: User },
  { id: 2, label: 'Pekerjaan',    icon: Briefcase },
  { id: 3, label: 'Akun & Status', icon: ShieldCheck },
]

export function EmployeeDrawer({ isOpen, onClose, onSuccess, employee }: EmployeeDrawerProps) {
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({
    full_name:         '',
    email:             '',
    phone:             '',
    employee_code:     '',
    department_id:     '',
    position_id:       '',
    hire_date:         new Date().toISOString().split('T')[0],
    employment_status: 'active',
  })

  const { data: depts }     = useApi<any[]>('/api/departments')
  const { data: positions } = useApi<any[]>('/api/positions')

  useEffect(() => {
    if (!isOpen) { setStep(1); return }
    if (employee) {
      setForm({
        full_name:         employee.full_name         || '',
        email:             employee.email             || '',
        phone:             employee.phone             || '',
        employee_code:     employee.employee_code     || '',
        department_id:     employee.department?.id    || employee.department_id || '',
        position_id:       employee.position?.id      || employee.position_id   || '',
        hire_date:         employee.join_date
          ? new Date(employee.join_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        employment_status: employee.status || 'active',
      })
    } else {
      setForm({ full_name: '', email: '', phone: '', employee_code: '', department_id: '', position_id: '', hire_date: new Date().toISOString().split('T')[0], employment_status: 'active' })
    }
  }, [employee, isOpen])

  if (!isOpen) return null

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  const canNext1 = form.full_name.trim() && form.email.trim()
  const canNext2 = true

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const url    = employee ? `/api/employees/${employee.id}` : '/api/employees'
      const method = employee ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) { onSuccess(); onClose() }
      else alert(json.error || 'Gagal menyimpan data')
    } catch { alert('Terjadi kesalahan sistem') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-[460px] bg-white h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/80">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">
              {employee ? 'Edit Karyawan' : 'Tambah Karyawan'}
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {employee ? `Mengubah data ${employee.full_name}` : 'Isi data karyawan baru'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-5 py-3 border-b border-border/60 bg-muted/20">
          {STEPS.map((s, i) => {
            const done   = step > s.id
            const active = step === s.id
            return (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all',
                    done   ? 'bg-emerald-500 text-white'
                    : active ? 'bg-primary text-white ring-3 ring-primary/20'
                             : 'bg-muted border border-border text-muted-foreground',
                  )}>
                    {done ? <Check className="w-3 h-3" /> : s.id}
                  </div>
                  <span className={cn(
                    'text-[12px] font-medium transition-colors',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-px mx-3 transition-colors', done ? 'bg-emerald-300' : 'bg-border')} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* ── Step 1: Personal ── */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <Field label="Nama Lengkap" required>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => set('full_name', e.target.value)}
                  placeholder="Andi Saputra"
                  className="input-field"
                />
              </Field>

              <Field label="Email Karyawan" required hint={employee ? 'Email tidak bisa diubah' : undefined}>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="andi@perusahaan.com"
                  disabled={!!employee}
                  className="input-field disabled:bg-muted/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
                />
              </Field>

              <Field label="Nomor Telepon">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="input-field"
                />
              </Field>
            </div>
          )}

          {/* ── Step 2: Work ── */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <Field label="Kode Karyawan" hint="Kosongkan untuk generate otomatis">
                <input
                  type="text"
                  value={form.employee_code}
                  onChange={e => set('employee_code', e.target.value)}
                  placeholder="EMP-001"
                  className="input-field"
                  style={{ fontFamily: 'Geist Mono, monospace' }}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Departemen">
                  <select
                    value={form.department_id}
                    onChange={e => set('department_id', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Pilih departemen</option>
                    {depts?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </Field>

                <Field label="Jabatan">
                  <select
                    value={form.position_id}
                    onChange={e => set('position_id', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Pilih jabatan</option>
                    {positions?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Tanggal Bergabung">
                <input
                  type="date"
                  value={form.hire_date}
                  onChange={e => set('hire_date', e.target.value)}
                  className="input-field"
                />
              </Field>
            </div>
          )}

          {/* ── Step 3: Account ── */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="p-3.5 rounded-md bg-blue-50 border border-blue-200/60 text-[12.5px] text-blue-700 leading-relaxed">
                {employee
                  ? 'Ubah status kepegawaian karyawan ini.'
                  : 'Karyawan akan menerima email undangan untuk mengatur kata sandi secara mandiri.'}
              </div>

              <Field label="Status Kepegawaian">
                <select
                  value={form.employment_status}
                  onChange={e => set('employment_status', e.target.value)}
                  className="input-field"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                  <option value="resign">Resign</option>
                </select>
              </Field>

              {/* Summary */}
              <div className="mt-4 rounded-md border border-border overflow-hidden">
                <div className="px-3.5 py-2 bg-muted/30 border-b border-border">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Ringkasan</p>
                </div>
                <div className="divide-y divide-border/50">
                  {[
                    { label: 'Nama',      value: form.full_name     || '—' },
                    { label: 'Email',     value: form.email         || '—' },
                    { label: 'Dept',      value: depts?.find((d: any) => d.id === form.department_id)?.name || '—' },
                    { label: 'Jabatan',   value: positions?.find((p: any) => p.id === form.position_id)?.name || '—' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center px-3.5 py-2">
                      <span className="text-[11.5px] text-muted-foreground w-16 shrink-0">{row.label}</span>
                      <span className="text-[12.5px] font-medium text-foreground truncate">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border/80 bg-muted/10">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="btn-outline gap-1.5 disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Kembali
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 ? !canNext1 : !canNext2}
              className="btn-primary gap-1.5 disabled:opacity-40"
            >
              Lanjut
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary min-w-[140px] justify-center"
            >
              {loading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Menyimpan...</>
                : (employee ? 'Simpan Perubahan' : 'Daftarkan Karyawan')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* Helper label wrapper */
function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-[12.5px] font-medium text-foreground">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11.5px] text-muted-foreground">{hint}</p>}
    </div>
  )
}