import { Clock, TrendingDown, Briefcase, DollarSign } from 'lucide-react'
import { useMonthlyReport } from '../../../hooks/useMonthlyReport'

function fmtMinutes(m: number) {
  if (m === 0) return '0 menit'
  const h   = Math.floor(m / 60)
  const min = m % 60
  return h > 0 ? `${h}j ${min}m` : `${min}m`
}

export default function MonthlyReportPage() {
  const {
    rows, totalCount, stats, departments, employees,
    filters, search, setFilters,
    isLoading, error,
  } = useMonthlyReport()

  const perPage    = filters.perPage ?? 15
  const page       = filters.page    ?? 1
  const totalPages = Math.ceil(totalCount / perPage)

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="page-title">Monthly Report</h1>
        <p className="text-sm text-gray-500 -mt-1">Rekap kehadiran bulanan per karyawan</p>
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
            <label className="text-xs font-medium text-gray-500">Select User</label>
            <select
              value={filters.employeeId ?? ''}
              onChange={e => setFilters({ employeeId: e.target.value || undefined })}
              className="input text-xs"
            >
              <option value="">Semua Karyawan</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.full_name}</option>
              ))}
            </select>
          </div>
          <button onClick={() => search({})} className="btn-primary text-xs px-5">
            Search
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <Clock size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Terlambat</p>
            <p className="text-base font-bold text-gray-900">{fmtMinutes(stats.total_late_minutes)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <TrendingDown size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Potongan</p>
            <p className="text-base font-bold text-gray-900">Rp 0</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
            <Briefcase size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Jam Kerja</p>
            <p className="text-base font-bold text-gray-900">{stats.total_work_hours.toFixed(1)} jam</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
            <DollarSign size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Payroll</p>
            <p className="text-base font-bold text-gray-900">Rp 0</p>
          </div>
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
                <th className="table-th">Karyawan</th>
                <th className="table-th">Departemen</th>
                <th className="table-th">Deduction Time</th>
                <th className="table-th">Deduction Rp</th>
                <th className="table-th">Work Time</th>
                <th className="table-th">Work Rp</th>
                <th className="table-th">Hadir</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">Loading...</td></tr>
              )}
              {!isLoading && rows.map(row => (
                <tr key={row.employee_id} className="table-tr-hover">
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
                  <td className="table-td text-xs text-gray-600">{row.department_name}</td>
                  <td className="table-td text-xs">
                    {row.total_late_minutes > 0
                      ? <span className="text-red-600 font-medium">{fmtMinutes(row.total_late_minutes)}</span>
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="table-td text-xs text-gray-400">Rp 0</td>
                  <td className="table-td text-xs text-gray-700">{row.total_work_hours.toFixed(1)} jam</td>
                  <td className="table-td text-xs text-gray-400">Rp 0</td>
                  <td className="table-td text-xs">
                    <span className="font-medium text-green-700">{row.total_present}</span>
                    <span className="text-gray-400"> / {row.total_records}</span>
                  </td>
                </tr>
              ))}
              {!isLoading && rows.length === 0 && !error && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">Belum ada data</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">Total: {totalCount} karyawan</div>
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
