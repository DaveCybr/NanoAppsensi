import { useState } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import clsx from 'clsx'
import { useIssueAttendance } from '../../hooks/useIssueAttendance'

const statusConfig: Record<string, string> = {
  'On-Time':        'badge-success',
  'Late':           'badge-danger',
  'In Tolerance':   'badge-info',
  'Early Check-Out': 'badge-danger',
  'Work From Home': 'bg-teal-100 text-teal-700 badge',
}
const locationConfig: Record<string, string> = {
  'In-Area':        'badge-success',
  'Work From Home': 'bg-teal-100 text-teal-700 badge',
  'Out of Area':    'badge-danger',
}

export default function IssueAttendance() {
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10))
  const [schedule, setSchedule] = useState('All Schedule')
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const perPage                 = 10

  const { records, totalCount, isLoading, error } = useIssueAttendance({
    date,
    schedule,
    search,
    page,
    perPage,
  })

  const totalPages = Math.ceil(totalCount / perPage)

  return (
    <div className="p-6 space-y-5">
      <h1 className="page-title">Issue Attendance</h1>

      <div className="card overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">📅</span>
            <input type="date" value={date} onChange={e => { setDate(e.target.value); setPage(1) }}
              className="input w-36 text-xs" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">Schedule Type</label>
            <select value={schedule} onChange={e => { setSchedule(e.target.value); setPage(1) }}
              className="select text-xs w-36">
              <option>All Schedule</option>
              <option>Office</option>
              <option>WFH</option>
            </select>
          </div>
          <div className="ml-auto">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
              <input type="text" placeholder="Search" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="input pl-7 w-44 text-xs" />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{error}</div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th w-12">Type</th>
                <th className="table-th">User Name</th>
                <th className="table-th text-right">Reason (Time)</th>
                <th className="table-th text-right">Note (Location)</th>
                <th className="table-th text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Loading...</td></tr>
              )}
              {!isLoading && records.map(row => (
                <tr key={row.id} className="table-tr-hover">
                  <td className="table-td">
                    <div className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      row.type === 'check-in' ? 'bg-green-50' : 'bg-red-50'
                    )}>
                      {row.type === 'check-in'
                        ? <LogIn size={15} className="text-green-600" />
                        : <LogOut size={15} className="text-red-500" />
                      }
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-bold">{row.userName.charAt(0)}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-800">{row.userName}</span>
                    </div>
                  </td>
                  <td className="table-td text-right">
                    <span className={statusConfig[row.statusIn] ?? 'bg-pink-100 text-pink-600 badge'}>
                      {row.statusIn}
                    </span>
                  </td>
                  <td className="table-td text-right">
                    <span className={locationConfig[row.locationIn] ?? 'badge-gray'}>
                      {row.locationIn}
                    </span>
                  </td>
                  <td className="table-td text-right text-xs font-mono text-gray-600">
                    {row.time}
                  </td>
                </tr>
              ))}
              {!isLoading && records.length === 0 && !error && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                    Tidak ada data issue presensi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Items per page:</span>
            <select className="select text-xs w-16">{[10, 25, 50].map(n => <option key={n}>{n}</option>)}</select>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>{totalCount === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount)} of {totalCount}</span>
            <button onClick={() => setPage(1)} disabled={page === 1} className="btn-icon text-xs">«</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-icon">‹</button>
            <button onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))} disabled={page >= totalPages} className="btn-icon">›</button>
            <button onClick={() => setPage(totalPages || 1)} disabled={page >= totalPages} className="btn-icon">»</button>
          </div>
        </div>
      </div>
    </div>
  )
}
