import { useState } from 'react'
import { Check, X } from 'lucide-react'
import clsx from 'clsx'
import { useLeave } from '../../hooks/useLeave'

type Tab = 'pending' | 'all'

const statusBadge: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700 badge',
  approved: 'badge-success',
  rejected: 'badge-danger',
}

export default function LeavePage() {
  const [tab, setTab]         = useState<Tab>('pending')
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const perPage               = 10

  const [rejectId, setRejectId]     = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const filters = {
    status: tab === 'pending' ? 'pending' as const : 'all' as const,
    search,
    page,
    perPage,
  }

  const { records, totalCount, isLoading, error, isActing, approve, reject } = useLeave(filters)
  const totalPages = Math.ceil(totalCount / perPage)

  const handleApprove = async (id: string) => {
    await approve(id)
  }

  const handleReject = async () => {
    if (!rejectId) return
    await reject(rejectId, rejectReason)
    setRejectId(null)
    setRejectReason('')
  }

  return (
    <div className="p-6 space-y-5">
      <h1 className="page-title">Leave Requests</h1>

      <div className="card overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-100 flex">
          {([
            { key: 'pending', label: 'Pending' },
            { key: 'all',     label: 'All History' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1) }}
              className={clsx(
                'px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-60">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="input pl-7 text-xs"
            />
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{error}</div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Karyawan</th>
                <th className="table-th">Jenis Cuti</th>
                <th className="table-th">Tanggal Mulai</th>
                <th className="table-th">Tanggal Selesai</th>
                <th className="table-th">Durasi</th>
                <th className="table-th">Alasan</th>
                <th className="table-th">Status</th>
                <th className="table-th w-24">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">Loading...</td></tr>
              )}
              {!isLoading && records.map(row => (
                <tr key={row.id} className="table-tr-hover">
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-bold">{row.employeeName.charAt(0)}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-800">{row.employeeName}</span>
                    </div>
                  </td>
                  <td className="table-td text-xs text-gray-700">{row.leave_type}</td>
                  <td className="table-td text-xs text-gray-600">{row.start_date}</td>
                  <td className="table-td text-xs text-gray-600">{row.end_date}</td>
                  <td className="table-td text-xs font-semibold text-gray-800">{row.duration} hari</td>
                  <td className="table-td text-xs text-gray-500 max-w-[180px] truncate">{row.reason ?? '—'}</td>
                  <td className="table-td">
                    <span className={statusBadge[row.status] ?? 'badge-gray'}>
                      {row.status}
                    </span>
                  </td>
                  <td className="table-td">
                    {row.status === 'pending' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleApprove(row.id)}
                          disabled={isActing}
                          title="Approve"
                          className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-300 transition-colors"
                        >
                          <Check size={12} className="text-green-600" />
                        </button>
                        <button
                          onClick={() => { setRejectId(row.id); setRejectReason('') }}
                          disabled={isActing}
                          title="Reject"
                          className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                        >
                          <X size={12} className="text-red-500" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && records.length === 0 && !error && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                    {tab === 'pending' ? 'Tidak ada pengajuan cuti yang menunggu persetujuan' : 'Belum ada data pengajuan cuti'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Total: {totalCount} pengajuan
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>{totalCount === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount)} of {totalCount}</span>
            <button onClick={() => setPage(1)} disabled={page === 1} className="btn-icon">«</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-icon">‹</button>
            <button onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))} disabled={page >= totalPages} className="btn-icon">›</button>
            <button onClick={() => setPage(totalPages || 1)} disabled={page >= totalPages} className="btn-icon">»</button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Tolak Pengajuan Cuti?</h3>
            <p className="text-sm text-gray-500 mb-3">Masukkan alasan penolakan (opsional):</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Alasan penolakan..."
              className="input text-sm resize-none w-full"
              rows={3}
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setRejectId(null)} className="btn-secondary text-xs">Batal</button>
              <button
                onClick={handleReject}
                disabled={isActing}
                className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {isActing ? 'Memproses...' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
