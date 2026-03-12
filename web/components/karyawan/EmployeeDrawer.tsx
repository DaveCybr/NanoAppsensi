"use client"

import React, { useState } from 'react'
import { X, User, Briefcase, Lock, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface EmployeeDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  employee?: any // If present, mode is edit
}

export function EmployeeDrawer({ isOpen, onClose, onSuccess, employee }: EmployeeDrawerProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: employee?.full_name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    employee_code: employee?.employee_code || '',
    department_id: employee?.department_id || '',
    position_id: employee?.position_id || '',
    join_date: employee?.join_date || '',
    status: employee?.status || 'active',
  })

  if (!isOpen) return null

  const steps = [
    { title: 'Data Pribadi', icon: User },
    { title: 'Pekerjaan', icon: Briefcase },
    { title: 'Akun', icon: Lock },
  ]

  const nextStep = () => setStep(s => Math.min(s + 1, 3))
  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      onSuccess()
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white h-screen shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{employee ? 'Edit' : 'Tambah'} Karyawan</h2>
            <p className="text-sm text-muted-foreground mt-1">Lengkapi informasi detail karyawan</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 bg-muted/30 border-b flex items-center justify-between">
          {steps.map((s, i) => {
            const num = i + 1
            const isCompleted = step > num
            const isActive = step === num
            return (
              <React.Fragment key={num}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    isActive ? "bg-primary text-white ring-4 ring-primary/10" : 
                    isCompleted ? "bg-green-500 text-white" : "bg-white text-muted-foreground border"
                  )}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : num}
                  </div>
                  <span className={cn("text-xs font-semibold", isActive ? "text-primary" : "text-muted-foreground")}>
                    {s.title}
                  </span>
                </div>
                {i < 2 && <div className="h-px bg-border flex-1 mx-2" />}
              </React.Fragment>
            )
          })}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1.5 text-left">
                <label className="text-sm font-semibold">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  placeholder="Contoh: Andi Saputra"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-sm font-semibold">Email Karyawan</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  placeholder="andi@perusahaan.com"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-sm font-semibold">Nomor Telepon</label>
                <input 
                  type="tel" 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  placeholder="0812xxxx"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1.5 text-left">
                <label className="text-sm font-semibold">Kode Karyawan</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  placeholder="EMP001"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Departemen</label>
                  <select className="w-full px-4 py-2 border rounded-lg bg-white outline-none">
                    <option value="">Pilih...</option>
                    <option value="it">IT & Engineering</option>
                    <option value="hr">Human Resources</option>
                  </select>
                </div>
                <div className="space-y-1.5 text-left text-left">
                  <label className="text-sm font-semibold">Jabatan</label>
                  <select className="w-full px-4 py-2 border rounded-lg bg-white outline-none">
                    <option value="">Pilih...</option>
                    <option value="it">Manager</option>
                    <option value="hr">Staff</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-sm font-semibold">Tanggal Bergabung</label>
                <input type="date" className="w-full px-4 py-2 border rounded-lg outline-none" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 border-primary/10">
                <p className="text-xs text-primary font-semibold mb-2">KEAMANAN AKUN</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Karyawan akan dikirimi email aktivasi untuk mengatur kata sandi mereka secara mandiri.
                </p>
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-sm font-semibold">Role Sistem</label>
                <select className="w-full px-4 py-2 border rounded-lg bg-white outline-none">
                  <option value="Employee">Karyawan</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/10 flex items-center justify-between">
          <button 
            onClick={prevStep}
            disabled={step === 1}
            className="btn-outline px-6 py-2.5 inline-flex items-center gap-2 group disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali
          </button>
          
          {step < 3 ? (
            <button 
              onClick={nextStep}
              className="btn-primary px-8 py-2.5 inline-flex items-center gap-2 group"
            >
              Lanjutkan
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary px-10 py-2.5 font-bold"
            >
              {loading ? 'Menyimpan...' : (employee ? 'Simpan Perubahan' : 'Daftarkan Karyawan')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
