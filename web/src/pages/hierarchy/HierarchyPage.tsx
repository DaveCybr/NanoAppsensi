import { useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import {
  usePositionList, usePositionMutations,
  useGradeList, useGradeMutations,
  useEmploymentStatusList, useEmploymentStatusMutations,
} from '../../hooks/useHierarchy'
import type { PositionRow, GradeRow, EmploymentStatusRow } from '../../lib/hierarchyService'

type Tab = 'position' | 'grade' | 'employment'

export default function HierarchyPage() {
  const [activeTab, setActiveTab] = useState<Tab>('position')

  // ── Position state ──
  const [posSearch, setPosSearch] = useState('')
  const [posModal, setPosModal] = useState(false)
  const [posEdit, setPosEdit] = useState<PositionRow | null>(null)
  const [posName, setPosName] = useState('')
  const [posConfirmId, setPosConfirmId] = useState<string | null>(null)

  // ── Grade state ──
  const [gradeSearch, setGradeSearch] = useState('')
  const [gradeModal, setGradeModal] = useState(false)
  const [gradeEdit, setGradeEdit] = useState<GradeRow | null>(null)
  const [gradeCode, setGradeCode] = useState('')
  const [gradeName, setGradeName] = useState('')
  const [gradeConfirmId, setGradeConfirmId] = useState<string | null>(null)

  // ── Employment Status state ──
  const [empSearch, setEmpSearch] = useState('')
  const [empModal, setEmpModal] = useState(false)
  const [empEdit, setEmpEdit] = useState<EmploymentStatusRow | null>(null)
  const [empCode, setEmpCode] = useState('')
  const [empName, setEmpName] = useState('')
  const [empConfirmId, setEmpConfirmId] = useState<string | null>(null)

  // ── Hooks ──
  const { positions, isLoading: posLoading, error: posError, refetch: posRefetch } = usePositionList()
  const posMutations = usePositionMutations(posRefetch)

  const { grades, isLoading: gradeLoading, error: gradeError, refetch: gradeRefetch } = useGradeList()
  const gradeMutations = useGradeMutations(gradeRefetch)

  const { statuses, isLoading: empLoading, error: empError, refetch: empRefetch } = useEmploymentStatusList()
  const empMutations = useEmploymentStatusMutations(empRefetch)

  // ── Position handlers ──
  const openPosAdd = () => { setPosEdit(null); setPosName(''); setPosModal(true) }
  const openPosEdit = (p: PositionRow) => { setPosEdit(p); setPosName(p.name); setPosModal(true) }
  const handlePosSave = async () => {
    if (!posName.trim()) return
    if (posEdit) await posMutations.update(posEdit.id, posName.trim())
    else await posMutations.create(posName.trim())
    setPosModal(false)
  }
  const handlePosDelete = async (id: string) => {
    await posMutations.remove(id)
    setPosConfirmId(null)
  }

  // ── Grade handlers ──
  const openGradeAdd = () => { setGradeEdit(null); setGradeCode(''); setGradeName(''); setGradeModal(true) }
  const openGradeEdit = (g: GradeRow) => { setGradeEdit(g); setGradeCode(g.code); setGradeName(g.name); setGradeModal(true) }
  const handleGradeSave = async () => {
    if (!gradeCode.trim() || !gradeName.trim()) return
    if (gradeEdit) await gradeMutations.update(gradeEdit.id, gradeCode.trim(), gradeName.trim())
    else await gradeMutations.create(gradeCode.trim(), gradeName.trim())
    setGradeModal(false)
  }
  const handleGradeDelete = async (id: string) => {
    await gradeMutations.remove(id)
    setGradeConfirmId(null)
  }

  // ── Employment Status handlers ──
  const openEmpAdd = () => { setEmpEdit(null); setEmpCode(''); setEmpName(''); setEmpModal(true) }
  const openEmpEdit = (s: EmploymentStatusRow) => { setEmpEdit(s); setEmpCode(s.code); setEmpName(s.name); setEmpModal(true) }
  const handleEmpSave = async () => {
    if (!empCode.trim() || !empName.trim()) return
    if (empEdit) await empMutations.update(empEdit.id, empCode.trim(), empName.trim())
    else await empMutations.create(empCode.trim(), empName.trim())
    setEmpModal(false)
  }
  const handleEmpDelete = async (id: string) => {
    await empMutations.remove(id)
    setEmpConfirmId(null)
  }

  const filteredPositions = positions.filter(p =>
    p.name.toLowerCase().includes(posSearch.toLowerCase())
  )
  const filteredGrades = grades.filter(g =>
    g.name.toLowerCase().includes(gradeSearch.toLowerCase()) ||
    g.code.toLowerCase().includes(gradeSearch.toLowerCase())
  )
  const filteredStatuses = statuses.filter(s =>
    s.name.toLowerCase().includes(empSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(empSearch.toLowerCase())
  )

  const tabs: { key: Tab; label: string }[] = [
    { key: 'position',   label: 'Position' },
    { key: 'grade',      label: 'Grade' },
    { key: 'employment', label: 'Employment Status' },
  ]

  return (
    <div className="p-6 space-y-5">
      <h1 className="page-title">Hierarchy</h1>

      <div className="card overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-100 flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Position Tab ── */}
        {activeTab === 'position' && (
          <div>
            <div className="p-4 flex items-center gap-3 border-b border-gray-100">
              <button onClick={openPosAdd} className="btn-primary text-xs">
                <Plus size={14} /> Add Position
              </button>
              <div className="relative ml-2">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
                <input type="text" placeholder="Search" value={posSearch}
                  onChange={e => setPosSearch(e.target.value)} className="input pl-7 w-44 text-xs" />
              </div>
            </div>

            {posError && (
              <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {posError}
              </div>
            )}

            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th w-16">No</th>
                  <th className="table-th">Position Name</th>
                  <th className="table-th w-32">Action</th>
                </tr>
              </thead>
              <tbody>
                {posLoading && (
                  <tr><td colSpan={3} className="text-center py-10 text-gray-400 text-sm">Loading...</td></tr>
                )}
                {!posLoading && filteredPositions.map((pos, i) => (
                  <tr key={pos.id} className="table-tr-hover">
                    <td className="table-td text-center text-xs text-gray-500">{i + 1}</td>
                    <td className="table-td text-xs font-medium text-gray-800">{pos.name}</td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        <button onClick={() => openPosEdit(pos)}
                          className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors">
                          <Edit size={12} className="text-blue-500" />
                        </button>
                        <button onClick={() => setPosConfirmId(pos.id)}
                          className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors">
                          <Trash2 size={12} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!posLoading && filteredPositions.length === 0 && !posError && (
                  <tr><td colSpan={3} className="text-center py-10 text-gray-400 text-sm">Belum ada data posisi</td></tr>
                )}
              </tbody>
            </table>

            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Items per page:</span>
                <select className="select text-xs w-16"><option>10</option></select>
              </div>
              <div className="text-xs text-gray-500">1–{filteredPositions.length} of {filteredPositions.length}</div>
            </div>
          </div>
        )}

        {/* ── Grade Tab ── */}
        {activeTab === 'grade' && (
          <div>
            <div className="p-4 flex items-center gap-3 border-b border-gray-100">
              <button onClick={openGradeAdd} className="btn-primary text-xs">
                <Plus size={14} /> Add Grade
              </button>
              <div className="relative ml-2">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
                <input type="text" placeholder="Search" value={gradeSearch}
                  onChange={e => setGradeSearch(e.target.value)} className="input pl-7 w-44 text-xs" />
              </div>
            </div>

            {gradeError && (
              <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {gradeError}
              </div>
            )}

            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th w-16">No</th>
                  <th className="table-th">Grade Code</th>
                  <th className="table-th">Grade Name</th>
                  <th className="table-th w-32">Action</th>
                </tr>
              </thead>
              <tbody>
                {gradeLoading && (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400 text-sm">Loading...</td></tr>
                )}
                {!gradeLoading && filteredGrades.map((g, i) => (
                  <tr key={g.id} className="table-tr-hover">
                    <td className="table-td text-center text-xs text-gray-500">{i + 1}</td>
                    <td className="table-td text-xs font-mono text-gray-700">{g.code}</td>
                    <td className="table-td text-xs font-medium text-gray-800">{g.name}</td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        <button onClick={() => openGradeEdit(g)}
                          className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors">
                          <Edit size={12} className="text-blue-500" />
                        </button>
                        <button onClick={() => setGradeConfirmId(g.id)}
                          className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors">
                          <Trash2 size={12} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!gradeLoading && filteredGrades.length === 0 && !gradeError && (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400 text-sm">Belum ada data grade</td></tr>
                )}
              </tbody>
            </table>

            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Items per page:</span>
                <select className="select text-xs w-16"><option>10</option></select>
              </div>
              <div className="text-xs text-gray-500">1–{filteredGrades.length} of {filteredGrades.length}</div>
            </div>
          </div>
        )}

        {/* ── Employment Status Tab ── */}
        {activeTab === 'employment' && (
          <div>
            <div className="p-4 flex items-center gap-3 border-b border-gray-100">
              <button onClick={openEmpAdd} className="btn-primary text-xs">
                <Plus size={14} /> Add Status
              </button>
              <div className="relative ml-2">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
                <input type="text" placeholder="Search" value={empSearch}
                  onChange={e => setEmpSearch(e.target.value)} className="input pl-7 w-44 text-xs" />
              </div>
            </div>

            {empError && (
              <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {empError}
              </div>
            )}

            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th w-16">No</th>
                  <th className="table-th">Code</th>
                  <th className="table-th">Status Name</th>
                  <th className="table-th w-32">Action</th>
                </tr>
              </thead>
              <tbody>
                {empLoading && (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400 text-sm">Loading...</td></tr>
                )}
                {!empLoading && filteredStatuses.map((s, i) => (
                  <tr key={s.id} className="table-tr-hover">
                    <td className="table-td text-center text-xs text-gray-500">{i + 1}</td>
                    <td className="table-td text-xs font-mono text-gray-700">{s.code}</td>
                    <td className="table-td text-xs font-medium text-gray-800">{s.name}</td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        <button onClick={() => openEmpEdit(s)}
                          className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors">
                          <Edit size={12} className="text-blue-500" />
                        </button>
                        <button onClick={() => setEmpConfirmId(s.id)}
                          className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors">
                          <Trash2 size={12} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!empLoading && filteredStatuses.length === 0 && !empError && (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400 text-sm">Belum ada data status karyawan</td></tr>
                )}
              </tbody>
            </table>

            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Items per page:</span>
                <select className="select text-xs w-16"><option>10</option></select>
              </div>
              <div className="text-xs text-gray-500">1–{filteredStatuses.length} of {filteredStatuses.length}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Position Modal ── */}
      {posModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              {posEdit ? 'Edit Position' : 'Add Position'}
            </h3>
            {posMutations.saveError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                {posMutations.saveError}
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Position Name</label>
              <input value={posName} onChange={e => setPosName(e.target.value)}
                className="input text-sm" placeholder="e.g. Supervisor" />
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setPosModal(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handlePosSave} disabled={posMutations.isSaving} className="btn-primary text-xs">
                {posMutations.isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Grade Modal ── */}
      {gradeModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              {gradeEdit ? 'Edit Grade' : 'Add Grade'}
            </h3>
            {gradeMutations.saveError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                {gradeMutations.saveError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Grade Code</label>
                <input value={gradeCode} onChange={e => setGradeCode(e.target.value)}
                  className="input text-sm" placeholder="e.g. G1" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Grade Name</label>
                <input value={gradeName} onChange={e => setGradeName(e.target.value)}
                  className="input text-sm" placeholder="e.g. Grade 1 - Entry Level" />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setGradeModal(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleGradeSave} disabled={gradeMutations.isSaving} className="btn-primary text-xs">
                {gradeMutations.isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Employment Status Modal ── */}
      {empModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              {empEdit ? 'Edit Employment Status' : 'Add Employment Status'}
            </h3>
            {empMutations.saveError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                {empMutations.saveError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Code</label>
                <input value={empCode} onChange={e => setEmpCode(e.target.value)}
                  className="input text-sm" placeholder="e.g. PKWT" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Status Name</label>
                <input value={empName} onChange={e => setEmpName(e.target.value)}
                  className="input text-sm" placeholder="e.g. Pegawai Kontrak" />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setEmpModal(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleEmpSave} disabled={empMutations.isSaving} className="btn-primary text-xs">
                {empMutations.isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modals ── */}
      {posConfirmId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Hapus Posisi?</h3>
            <p className="text-sm text-gray-500 mb-5">Data posisi ini akan dihapus secara permanen.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setPosConfirmId(null)} className="btn-secondary text-xs">Batal</button>
              <button onClick={() => handlePosDelete(posConfirmId)}
                disabled={posMutations.isDeleting}
                className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                {posMutations.isDeleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {gradeConfirmId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Hapus Grade?</h3>
            <p className="text-sm text-gray-500 mb-5">Data grade ini akan dihapus secara permanen.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setGradeConfirmId(null)} className="btn-secondary text-xs">Batal</button>
              <button onClick={() => handleGradeDelete(gradeConfirmId)}
                disabled={gradeMutations.isDeleting}
                className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                {gradeMutations.isDeleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {empConfirmId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Hapus Status Karyawan?</h3>
            <p className="text-sm text-gray-500 mb-5">Data status ini akan dihapus secara permanen.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEmpConfirmId(null)} className="btn-secondary text-xs">Batal</button>
              <button onClick={() => handleEmpDelete(empConfirmId)}
                disabled={empMutations.isDeleting}
                className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                {empMutations.isDeleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
