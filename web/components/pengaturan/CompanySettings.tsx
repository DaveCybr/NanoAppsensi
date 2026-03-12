"use client"

import React, { useState } from 'react'
import { Loader2, Save, Building2, MapPin } from 'lucide-react'
import { useApi } from '@/hooks/useApi'

export function CompanySettings() {
  const { data: settings, loading, refetch } = useApi<any>('/api/settings')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>(null)

  React.useEffect(() => {
    if (settings && !form) {
      setForm({
        name: settings.name || '',
        timezone: settings.timezone || 'Asia/Jakarta',
        locale: settings.locale || 'id',
        checkin_radius_meters: settings.checkin_radius_meters || 100,
        face_confidence_threshold: settings.face_confidence_threshold || 75,
        work_hours_per_day: settings.work_hours_per_day || 8,
        overtime_threshold_hours: settings.overtime_threshold_hours || 8,
      })
    }
  }, [settings, form])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const json = await res.json()
      if (json.success) {
        alert('Pengaturan berhasil disimpan!')
        refetch()
      } else {
        alert(json.error || 'Gagal menyimpan')
      }
    } catch {
      alert('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const updateField = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }))

  return (
    <div className="space-y-8">
      {/* Company Info */}
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Informasi Perusahaan</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Nama Perusahaan</label>
            <input
              type="text"
              className="input-field"
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Slug</label>
            <input type="text" className="input-field bg-muted/30" value={settings?.slug || ''} disabled />
            <p className="text-[10px] text-muted-foreground">Tidak bisa diubah</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Timezone</label>
            <select
              className="input-field"
              value={form.timezone}
              onChange={e => updateField('timezone', e.target.value)}
            >
              <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
              <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
              <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Paket Langganan</label>
            <input type="text" className="input-field bg-muted/30 capitalize" value={settings?.subscription_plan || ''} disabled />
          </div>
        </div>
      </div>

      {/* Attendance Config */}
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Konfigurasi Absensi</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Radius Check-in (meter)</label>
            <input
              type="number"
              className="input-field"
              value={form.checkin_radius_meters}
              onChange={e => updateField('checkin_radius_meters', Number(e.target.value))}
              min={10} max={5000}
            />
            <p className="text-[10px] text-muted-foreground">Jarak maksimal dari lokasi kerja untuk check-in valid</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Confidence Threshold Face Match (%)</label>
            <input
              type="number"
              className="input-field"
              value={form.face_confidence_threshold}
              onChange={e => updateField('face_confidence_threshold', Number(e.target.value))}
              min={0} max={100}
            />
            <p className="text-[10px] text-muted-foreground">Minimum skor kecocokan wajah untuk validasi</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Jam Kerja per Hari</label>
            <input
              type="number"
              className="input-field"
              value={form.work_hours_per_day}
              onChange={e => updateField('work_hours_per_day', Number(e.target.value))}
              min={1} max={24}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Threshold Lembur (jam)</label>
            <input
              type="number"
              className="input-field"
              value={form.overtime_threshold_hours}
              onChange={e => updateField('overtime_threshold_hours', Number(e.target.value))}
              min={1} max={24}
            />
            <p className="text-[10px] text-muted-foreground">Jam kerja melebihi threshold dihitung sebagai lembur</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-8 font-bold flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  )
}
