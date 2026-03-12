"use client"

import React, { useState } from 'react'
import { Plus, Calendar, Loader2, Check, X, FileText } from 'lucide-react'
import { useApi } from '@/hooks/useApi'

export function LeaveTypeManager() {
  const { data: leaveTypes, loading, refetch } = useApi<any[]>('/api/leave/types')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    max_days: 12,
    is_paid: true,
    requires_document: false,
  })

  const handleAdd = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/leave/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const json = await res.json()
      if (json.success) {
        setForm({ name: '', max_days: 12, is_paid: true, requires_document: false })
        setAdding(false)
        refetch()
      } else {
        alert(json.error || 'Gagal menambah jenis cuti')
      }
    } catch { alert('Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="p-6 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-lg font-bold">Jenis Cuti</h3>
            <p className="text-xs text-muted-foreground">Kelola tipe cuti yang tersedia untuk karyawan</p>
          </div>
        </div>
        <button onClick={() => setAdding(!adding)} className="btn-outline text-xs px-3 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Tambah
        </button>
      </div>

      {adding && (
        <div className="p-4 bg-primary/5 border-b space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text" placeholder="Nama jenis cuti" className="input-field text-sm"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <input
              type="number" placeholder="Maks hari" className="input-field text-sm"
              value={form.max_days} onChange={e => setForm(f => ({ ...f, max_days: Number(e.target.value) }))}
              min={1}
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_paid} onChange={e => setForm(f => ({ ...f, is_paid: e.target.checked }))} className="rounded" />
              <span className="font-medium">Cuti dibayar</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.requires_document} onChange={e => setForm(f => ({ ...f, requires_document: e.target.checked }))} className="rounded" />
              <span className="font-medium">Wajib lampiran</span>
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="btn-outline text-xs px-4">Batal</button>
            <button onClick={handleAdd} disabled={saving} className="btn-primary text-xs px-4 flex items-center gap-1">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />} Simpan
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Maks Hari</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Dibayar</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Lampiran</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr><td colSpan={4} className="px-6 py-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></td></tr>
            )}
            {leaveTypes?.map((lt: any) => (
              <tr key={lt.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary/50" />
                    <span className="text-sm font-bold">{lt.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium">{lt.max_days} hari</span>
                </td>
                <td className="px-6 py-4">
                  {lt.is_paid ? (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">YA</span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">TIDAK</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {lt.requires_document ? (
                    <FileText className="w-4 h-4 text-amber-500" />
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && (!leaveTypes || leaveTypes.length === 0) && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">Belum ada jenis cuti</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
