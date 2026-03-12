import { Eye } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { useActivityReport } from '../../../hooks/useActivityReport'
import type { ActivityRow } from '../../../lib/activityReportService'

function groupByDate(rows: ActivityRow[]): [string, ActivityRow[]][] {
  const map = new Map<string, ActivityRow[]>()
  rows.forEach(row => {
    if (!map.has(row.attendance_date)) map.set(row.attendance_date, [])
    map.get(row.attendance_date)!.push(row)
  })
  return Array.from(map.entries())
}

function fmtDateHeader(dateStr: string) {
  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return format(date, 'dd-MM-yyyy', { locale: idLocale })
  } catch { return dateStr }
}

function locBadge(loc: string) {
  if (loc === 'Dalam Area') return 'badge-success'
  if (loc === 'Luar Area')  return 'badge-danger'
  return 'badge'
}

export default function ActivityReportPage() {
  const {
    rows, totalCount, departments,
    filters, search, setFilters,
    isLoading, error,
  } = useActivityReport()

  const perPage    = filters.perPage ?? 20
  const page       = filters.page    ?? 1
  const totalPages = Math.ceil(totalCount / perPage)
  const grouped    = groupByDate(rows)

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="page-title">Activity Report</h1>
        <p className="text-sm text-gray-500 -mt-1">Riwayat aktivitas kehadiran karyawan</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters({ startDate: e.target.value })}
              className="input text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => setFilters({ endDate: e.target.value })}
              className="input text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Group</label>
            <select
              value={filters.departmentId ?? ''}
              onChange={e => setFilters({ departmentId: e.target.value || undefined })}
              className="input text-xs"
            >
              <option value="">Semua Group</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Search</label>
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={filters.search ?? ''}
              onChange={e => setFilters({ search: e.target.value })}
              className="input text-xs w-44"
            />
          </div>
          <button onClick={() => search({})} className="btn-primary text-xs px-5">
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Employee Name</th>
                <th className="table-th">Title</th>
                <th className="table-th">Description</th>
                <th className="table-th">Time</th>
                <th className="table-th">Location</th>
                <th className="table-th w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">Loading...</td></tr>
              )}
              {!isLoading && grouped.map(([date, dateRows]) => (
                <>
                  {/* Date group header */}
                  <tr key={`hdr-${date}`} className="bg-gray-50">
                    <td colSpan={6} className="px-4 py-2">
                      <span className="text-xs font-semibold text-gray-600">{fmtDateHeader(date)}</span>
                    </td>
                  </tr>
                  {dateRows.map(row => (
                    <tr key={row.id} className="table-tr-hover">
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0">
                            <span className="text-white text-[10px] font-bold">{row.employee_name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-800">{row.employee_name}</p>
                            {row.employee_code && <p className="text-[10px] text-gray-400">{row.employee_code}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        <span
                          className="badge text-[10px]"
                          style={row.status_color ? { backgroundColor: row.status_color + '20', color: row.status_color, borderColor: row.status_color + '40' } : {}}
                        >
                          {row.title}
                        </span>
                      </td>
                      <td className="table-td text-xs text-gray-600 max-w-[200px] truncate">{row.description}</td>
                      <td className="table-td text-xs font-medium text-gray-700">{row.time}</td>
                      <td className="table-td">
                        <span className={`badge text-[10px] ${locBadge(row.location)}`}>{row.location}</span>
                      </td>
                      <td className="table-td">
                        <button
                          title="Lihat detail"
                          className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        >
                          <Eye size={12} className="text-blue-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
              {!isLoading && rows.length === 0 && !error && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">Belum ada data</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">Total: {totalCount} aktivitas</div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>{totalCount === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount)} of {totalCount}</span>
            <button onClick={() => setFilters({ page: 1 })} disabled={page === 1} className="btn-icon">«</button>
            <button onClick={() => setFilters({ page: Math.max(1, page - 1) })} disabled={page === 1} className="btn-icon">‹</button>
            <button onClick={() => setFilters({ page: Math.min(totalPages || 1, page + 1) })} disabled={page >= totalPages} className="btn-icon">›</button>
            <button onClick={() => setFilters({ page: totalPages || 1 })} disabled={page >= totalPages} className="btn-icon">»</button>
          </div>
        </div>
      </div>
    </div>
  )
}
