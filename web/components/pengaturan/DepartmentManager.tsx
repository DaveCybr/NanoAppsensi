"use client"

import React, { useState } from 'react'
import { Plus, Users, Briefcase, Loader2, Trash2 } from 'lucide-react'
import { useApi } from '@/hooks/useApi'

export function DepartmentManager() {
  const { data: departments, loading: deptLoading, refetch: refetchDepts } = useApi<any[]>('/api/departments')
  const { data: positions, loading: posLoading, refetch: refetchPositions } = useApi<any[]>('/api/positions')

  const [addingDept, setAddingDept] = useState(false)
  const [addingPos, setAddingPos] = useState(false)
  const [deptName, setDeptName] = useState('')
  const [deptDesc, setDeptDesc] = useState('')
  const [posName, setPosName] = useState('')
  const [posDesc, setPosDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAddDept = async () => {
    if (!deptName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deptName, description: deptDesc || null })
      })
      const json = await res.json()
      if (json.success) {
        setDeptName(''); setDeptDesc(''); setAddingDept(false)
        refetchDepts()
      } else {
        alert(json.error || 'Gagal menambah departemen')
      }
    } catch { alert('Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const handleAddPos = async () => {
    if (!posName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: posName, description: posDesc || null })
      })
      const json = await res.json()
      if (json.success) {
        setPosName(''); setPosDesc(''); setAddingPos(false)
        refetchPositions()
      } else {
        alert(json.error || 'Gagal menambah jabatan')
      }
    } catch { alert('Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Departments */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">Departemen</h3>
          </div>
          <button onClick={() => setAddingDept(!addingDept)} className="btn-outline text-xs px-3 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Tambah
          </button>
        </div>

        {addingDept && (
          <div className="p-4 bg-primary/5 border-b space-y-3">
            <input
              type="text" placeholder="Nama departemen" className="input-field text-sm"
              value={deptName} onChange={e => setDeptName(e.target.value)}
            />
            <input
              type="text" placeholder="Deskripsi (opsional)" className="input-field text-sm"
              value={deptDesc} onChange={e => setDeptDesc(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAddingDept(false)} className="btn-outline text-xs px-4">Batal</button>
              <button onClick={handleAddDept} disabled={saving} className="btn-primary text-xs px-4 flex items-center gap-1">
                {saving && <Loader2 className="w-3 h-3 animate-spin" />} Simpan
              </button>
            </div>
          </div>
        )}

        <div className="divide-y relative">
          {deptLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {departments?.map((dept: any) => (
            <div key={dept.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
              <div>
                <p className="text-sm font-bold">{dept.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {dept.employee_count ?? 0} karyawan
                  {dept.description && ` • ${dept.description}`}
                </p>
              </div>
            </div>
          ))}
          {!deptLoading && (!departments || departments.length === 0) && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">Belum ada departemen</div>
          )}
        </div>
      </div>

      {/* Positions */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">Jabatan</h3>
          </div>
          <button onClick={() => setAddingPos(!addingPos)} className="btn-outline text-xs px-3 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Tambah
          </button>
        </div>

        {addingPos && (
          <div className="p-4 bg-primary/5 border-b space-y-3">
            <input
              type="text" placeholder="Nama jabatan" className="input-field text-sm"
              value={posName} onChange={e => setPosName(e.target.value)}
            />
            <input
              type="text" placeholder="Deskripsi (opsional)" className="input-field text-sm"
              value={posDesc} onChange={e => setPosDesc(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAddingPos(false)} className="btn-outline text-xs px-4">Batal</button>
              <button onClick={handleAddPos} disabled={saving} className="btn-primary text-xs px-4 flex items-center gap-1">
                {saving && <Loader2 className="w-3 h-3 animate-spin" />} Simpan
              </button>
            </div>
          </div>
        )}

        <div className="divide-y relative">
          {posLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {positions?.map((pos: any) => (
            <div key={pos.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
              <div>
                <p className="text-sm font-bold">{pos.name}</p>
                {pos.description && <p className="text-[10px] text-muted-foreground">{pos.description}</p>}
              </div>
            </div>
          ))}
          {!posLoading && (!positions || positions.length === 0) && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">Belum ada jabatan</div>
          )}
        </div>
      </div>
    </div>
  )
}
