"use client"

import React, { useState, useEffect } from 'react'
import { X, Calendar, FileText, AlertCircle, Info, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useApi } from '@/hooks/useApi'
import { useAuth } from '@/hooks/useAuth'

interface LeaveDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function LeaveDrawer({ isOpen, onClose, onSuccess }: LeaveDrawerProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const initialFormData = {
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
    attachment_url: ''
  }
  const [formData, setFormData] = useState(initialFormData)

  const resetForm = () => setFormData(initialFormData)

  // Fetch leave types
  const { data: leaveTypes } = useApi<any[]>('/api/leave/types')

  // Fetch balance for selected leave type
  const currentYear = new Date().getFullYear()
  const { data: balances } = useApi<any[]>(
    user?.employee_id ? `/api/leave/balances?year=${currentYear}&employee_id=${user.employee_id}` : null
  )

  const selectedType = leaveTypes?.find(t => t.id === formData.leave_type_id)
  const selectedBalance = balances?.find(b => b.leave_type_id === formData.leave_type_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/leave/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const json = await res.json()
      if (json.success) {
        resetForm()
        onSuccess()
        onClose()
      } else {
        alert(json.error || 'Gagal mengirim pengajuan')
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/leave/upload-attachment', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success && json.data?.url) {
        setFormData(prev => ({ ...prev, attachment_url: json.data.url }))
      } else {
        alert(json.error || 'Gagal upload file')
      }
    } catch {
      alert('Gagal upload file')
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end text-left">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={handleClose} />
      
      <div className="relative w-full max-w-lg bg-white h-screen shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Ajukan Permohonan Cuti</h2>
            <p className="text-sm text-muted-foreground mt-1">Isi formulir pengajuan cuti Anda</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info User */}
          <div className="p-4 bg-muted/30 rounded-xl border flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-sm font-bold">{user?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Jenis Cuti</label>
              <select 
                required 
                value={formData.leave_type_id}
                onChange={(e) => setFormData({...formData, leave_type_id: e.target.value})}
                className="w-full px-4 py-2 bg-muted/30 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg text-sm transition-all outline-none"
              >
                <option value="">Pilih Jenis Cuti...</option>
                {leaveTypes?.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {selectedType && (
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
                <Info className="w-4 h-4 text-primary mt-0.5" />
                <div className="text-left">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Informasi Saldo ({currentYear})</p>
                  <p className="text-sm text-primary/80 mt-1">
                    Sisa {selectedType.name} Anda adalah <span className="font-bold">{selectedBalance?.remaining_days ?? 0} hari</span>.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 shadow-sm">
              <label className="text-sm font-semibold">Tgl Mulai</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="date" 
                  required 
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-muted/30 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg text-sm transition-all outline-none" 
                />
              </div>
            </div>
            <div className="space-y-1.5 shadow-sm">
              <label className="text-sm font-semibold">Tgl Selesai</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="date" 
                  required 
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-muted/30 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg text-sm transition-all outline-none" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Alasan / Keperluan</label>
            <textarea 
              required
              rows={3}
              placeholder="Minimal 10 karakter..."
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="w-full px-4 py-2 bg-muted/30 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg text-sm transition-all outline-none border"
            />
          </div>

          {selectedType?.requires_document && (
            <div className="space-y-1.5 text-left">
              <label className="text-sm font-semibold">Lampiran (Wajib)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center bg-muted/20 text-muted-foreground group hover:bg-muted/30 transition-all cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 mb-2 animate-spin text-primary" />
                ) : (
                  <FileText className="w-8 h-8 mb-2 opacity-20" />
                )}
                <p className="text-xs font-semibold">
                  {formData.attachment_url ? '✅ File berhasil diupload. Klik untuk ganti.' : 'Upload file pendukung (PDF/JPG)'}
                </p>
              </div>
            </div>
          )}

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed font-medium">
              Pastikan periode cuti tidak tumpang tindih dengan pengajuan lain.
            </p>
          </div>
          {/* Footer inside form so type="submit" works */}
          <div className="p-6 border-t bg-muted/10 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <button type="button" onClick={handleClose} className="btn-outline px-6">Batal</button>
            <button 
              type="submit"
              disabled={loading}
              className="btn-primary px-8 font-bold flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
