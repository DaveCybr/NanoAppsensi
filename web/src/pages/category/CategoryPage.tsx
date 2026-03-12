import { useState } from 'react'
import { Edit } from 'lucide-react'
import { useAttendanceStatuses } from '../../hooks/useCategory'
import type { AttendanceStatusRow } from '../../lib/categoryService'

export default function CategoryPage() {
  const { statuses, isLoading, error, isSaving, saveError, setSaveError, update } = useAttendanceStatuses()

  const [editItem, setEditItem] = useState<AttendanceStatusRow | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const openEdit = (s: AttendanceStatusRow) => {
    setEditItem(s)
    setEditName(s.name)
    setEditColor(s.color ?? '#6b7280')
    setSaveError(null)
  }

  const handleSave = async () => {
    if (!editItem || !editName.trim()) return
    const { error } = await update(editItem.id, { name: editName.trim(), color: editColor })
    if (!error) setEditItem(null)
  }

  return (
    <div className="p-6 space-y-5">
      <h1 className="page-title">Category</h1>

      {/* Attendance Status Card */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Status Kehadiran</h2>
          <p className="text-xs text-gray-400 mt-0.5">Kelola nama dan warna untuk setiap status kehadiran karyawan</p>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{error}</div>
        )}

        <table className="w-full">
          <thead>
            <tr>
              <th className="table-th w-16">No</th>
              <th className="table-th">Code</th>
              <th className="table-th">Status Name</th>
              <th className="table-th w-28">Color</th>
              <th className="table-th w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Loading...</td></tr>
            )}
            {!isLoading && statuses.map((s, i) => (
              <tr key={s.id} className="table-tr-hover">
                <td className="table-td text-center text-xs text-gray-500">{i + 1}</td>
                <td className="table-td text-xs font-mono text-gray-700">{s.code}</td>
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color ?? '#6b7280' }}
                    />
                    <span className="text-xs font-medium text-gray-800">{s.name}</span>
                  </div>
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded border border-gray-200"
                      style={{ backgroundColor: s.color ?? '#6b7280' }}
                    />
                    <span className="text-xs font-mono text-gray-500">{s.color ?? '—'}</span>
                  </div>
                </td>
                <td className="table-td">
                  <button
                    onClick={() => openEdit(s)}
                    className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                    <Edit size={12} className="text-blue-500" />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && statuses.length === 0 && !error && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Belum ada data</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Edit Status Kehadiran</h3>
            {saveError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">{saveError}</div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Code</label>
                <input
                  value={editItem.code}
                  disabled
                  className="input text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Status Name</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="input text-sm"
                  placeholder="Nama status"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editColor}
                    onChange={e => setEditColor(e.target.value)}
                    className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0.5"
                  />
                  <span className="text-xs font-mono text-gray-500">{editColor}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setEditItem(null)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="btn-primary text-xs">
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
