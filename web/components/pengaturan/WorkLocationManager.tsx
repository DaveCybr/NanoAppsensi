"use client"

import React, { useState } from 'react'
import { Plus, MapPin, Loader2, CheckCircle2, Trash2 } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { cn } from '@/lib/utils/cn'

export function WorkLocationManager() {
  const { data: locations, loading, refetch } = useApi<any[]>('/api/work-locations')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    address: '',
    latitude: -6.2088,
    longitude: 106.8456,
    radius_meters: 100,
    is_default: false,
  })

  const handleAdd = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/work-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, address: form.address || null })
      })
      const json = await res.json()
      if (json.success) {
        setForm({ name: '', address: '', latitude: -6.2088, longitude: 106.8456, radius_meters: 100, is_default: false })
        setAdding(false)
        refetch()
      } else {
        alert(json.error || 'Gagal menambah lokasi')
      }
    } catch { alert('Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus lokasi kerja ini?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/work-locations/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        refetch()
      } else {
        alert(json.error || 'Gagal menghapus')
      }
    } catch { alert('Terjadi kesalahan') }
    finally { setDeletingId(null) }
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="p-6 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-lg font-bold">Lokasi Kerja</h3>
            <p className="text-xs text-muted-foreground">Titik GPS untuk validasi check-in karyawan</p>
          </div>
        </div>
        <button onClick={() => setAdding(!adding)} className="btn-outline text-xs px-3 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Tambah
        </button>
      </div>

      {adding && (
        <div className="p-4 bg-primary/5 border-b space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="Nama lokasi" className="input-field text-sm"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input type="text" placeholder="Alamat (opsional)" className="input-field text-sm"
              value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            <input type="number" placeholder="Latitude" className="input-field text-sm" step="0.0001"
              value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: Number(e.target.value) }))} />
            <input type="number" placeholder="Longitude" className="input-field text-sm" step="0.0001"
              value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: Number(e.target.value) }))} />
            <input type="number" placeholder="Radius (meter)" className="input-field text-sm"
              value={form.radius_meters} onChange={e => setForm(f => ({ ...f, radius_meters: Number(e.target.value) }))} min={10} max={5000} />
            <label className="flex items-center gap-2 text-sm cursor-pointer px-1">
              <input type="checkbox" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} className="rounded" />
              <span className="font-medium">Lokasi default</span>
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

      <div className="divide-y relative">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {locations?.map((loc: any) => (
          <div key={loc.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                loc.is_default ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
              )}>
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">{loc.name}</p>
                  {loc.is_default && (
                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> DEFAULT
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {loc.address || `${loc.latitude}, ${loc.longitude}`} • Radius: {loc.radius_meters}m
                </p>
              </div>
            </div>
            {!loc.is_default && (
              <button
                onClick={() => handleDelete(loc.id)}
                disabled={deletingId === loc.id}
                className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              >
                {deletingId === loc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        ))}
        {!loading && (!locations || locations.length === 0) && (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Belum ada lokasi kerja</div>
        )}
      </div>
    </div>
  )
}
