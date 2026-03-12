import { useState } from 'react'
import { Check, X, ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import { useApproval } from '../../hooks/useApproval'

type Tab = 'pending' | 'all'

const statusBadge: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700 badge',
  approved: 'badge-success',
  rejected: 'badge-danger',
}

export default function ApprovalPage() {
  const [tab, setTab]       = useState<Tab>('pending')
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const perPage             = 10

  const filters = {
    status: tab === 'pending' ? 'pending' as const : 'all' as const,
    search,
    page,
    perPage,
  }

  const { records, totalCount, isLoading, error, isActing, approve, reject } = useApproval(filters)
  const totalPages = Math.ceil(totalCount / perPage)

  return (
    <div className="p-6 space-y-5">
      <h1 className="page-title">Approval</h1>
      <p className="text-sm text-gray-500 -mt-3">Persetujuan koreksi data kehadiran karyawan</p>

      <div className="card overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-100 flex">
          {([
            { key: 'pending', label: 'Menunggu Persetujuan' },
            { key: 'all',     label: 'Semua Riwayat' },
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
                <th className="table-th">Check In</th>
                <th className="table-th">Check Out</th>
                <th className="table-th">Alasan Koreksi</th>
                <th className="table-th">Status</th>
                <th className="table-th w-24">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">Loading...</td></tr>
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
                  <td className="table-td">
                    {(row.before_check_in !== '—' || row.after_check_in !== '—') ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-gray-400 line-through">{row.before_check_in}</span>
                        <ArrowRight size={10} className="text-gray-400 shrink-0" />
                        <span className="font-semibold text-blue-600">{row.after_check_in}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="table-td">
                    {(row.before_check_out !== '—' || row.after_check_out !== '—') ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-gray-400 line-through">{row.before_check_out}</span>
                        <ArrowRight size={10} className="text-gray-400 shrink-0" />
                        <span className="font-semibold text-blue-600">{row.after_check_out}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="table-td text-xs text-gray-600 max-w-[200px] truncate">{row.reason}</td>
                  <td className="table-td">
                    <span className={statusBadge[row.status] ?? 'badge-gray'}>{row.status}</span>
                  </td>
                  <td className="table-td">
                    {row.status === 'pending' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => approve(row.id)}
                          disabled={isActing}
                          title="Setujui"
                          className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-300 transition-colors"
                        >
                          <Check size={12} className="text-green-600" />
                        </button>
                        <button
                          onClick={() => reject(row.id)}
                          disabled={isActing}
                          title="Tolak"
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
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    {tab === 'pending' ? 'Tidak ada koreksi yang menunggu persetujuan' : 'Belum ada riwayat koreksi'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">Total: {totalCount} pengajuan</div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>{totalCount === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount)} of {totalCount}</span>
            <button onClick={() => setPage(1)} disabled={page === 1} className="btn-icon">«</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-icon">‹</button>
            <button onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))} disabled={page >= totalPages} className="btn-icon">›</button>
            <button onClick={() => setPage(totalPages || 1)} disabled={page >= totalPages} className="btn-icon">»</button>
          </div>
        </div>
      </div>
    </div>
  )
}
