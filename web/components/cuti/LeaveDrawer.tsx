"use client"

import React, { useState } from 'react'
import { X, Calendar, FileText, AlertCircle, Info, ChevronRight, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface LeaveDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function LeaveDrawer({ isOpen, onClose, onSuccess }: LeaveDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [leaveType, setLeaveType] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
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
            <h2 className="text-xl font-bold">Ajukan Permohonan Cuti</h2>
            <p className="text-sm text-muted-foreground mt-1">Isi formulir pengajuan cuti karyawan</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          {/* Employee Selection */}
          <div className="space-y-1.5 text-left">
            <label className="text-sm font-semibold">Karyawan</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select required className="w-full pl-10 pr-4 py-2 bg-muted/30 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg text-sm transition-all outline-none appearance-none cursor-pointer">
                <option value="">Pilih Karyawan...</option>
                <option value="1">Andi Saputra (EMP001)</option>
                <option value="2">Budi Hartanto (EMP002)</option>
              </select>
            </div>
          </div>

          {/* Leave Type & Balance Preview */}
          <div className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-sm font-semibold">Jenis Cuti</label>
              <select 
                required 
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full px-4 py-2 bg-muted/30 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg text-sm transition-all outline-none"
              >
                <option value="">Pilih Jenis Cuti...</option>
                <option value="Tahunan">Cuti Tahunan</option>
                <option value="Sakit">Sakit</option>
                <option value="Izin">Izin Khusus / Penting</option>
                <option value="Melahirkan">Cuti Melahirkan</option>
              </select>
            </div>

            {leaveType === 'Tahunan' && (
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
                <Info className="w-4 h-4 text-primary mt-0.5" />
                <div className="text-left">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Informasi Saldo</p>
                  <p className="text-sm text-primary/80 mt-1">
                    Sisa cuti tahunan Andi Saputra saat ini adalah <span className="font-bold">12 hari</span>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="space-y-1.5 text-left">
              <label className="text-sm font-semibold">Tgl Mulai</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="date" required className="w-full pl-10 pr-4 py-2 bg-muted/30 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg text-sm transition-all outline-none" />
              </div>
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-sm font-semibold">Tgl Selesai</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="date" required className="w-full pl-10 pr-4 py-2 bg-muted/30 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg text-sm transition-all outline-none" />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5 text-left">
            <label className="text-sm font-semibold">Alasan / Keperluan</label>
            <textarea 
              required
              rows={4}
              placeholder="Contoh: Urusan keluarga ke luar kota..."
              className="w-full px-4 py-2 bg-muted/30 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg text-sm transition-all outline-none border"
            />
          </div>

          {/* Attachment */}
          <div className="space-y-1.5 text-left">
            <label className="text-sm font-semibold">Lampiran (Opsional)</label>
            <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center bg-muted/20 text-muted-foreground group hover:bg-muted/30 hover:border-primary/30 transition-all cursor-pointer">
              <FileText className="w-8 h-8 mb-2 opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all" />
              <p className="text-xs font-semibold">Klik untuk upload file pendukung</p>
              <p className="text-[10px] mt-1">PDF, JPG, atau PNG (Maks. 5MB)</p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed font-medium">
              Pengajuan ini akan diteruskan ke Atasan Langsung dan HR Manager untuk persetujuan.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/10 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-outline px-6">Batal</button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary px-8 font-bold shadow-lg shadow-primary/20"
          >
            {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
          </button>
        </div>
      </div>
    </div>
  )
}
