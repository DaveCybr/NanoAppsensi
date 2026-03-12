import { useState } from 'react'
import {
  Download, Clock, MapPin, AlertTriangle, CheckCircle2,
  XCircle, RefreshCw, Loader2, AlertCircle, Users, CalendarDays,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useSummaryReport } from '../../hooks/useSummaryReport'
import type { AttendanceRow } from '../../lib/summaryReportService'
import clsx from 'clsx'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ code, name }: { code: string; name: string }) {
  const cls: Record<string, string> = {
    present:   'badge-success',
    late:      'badge-warning',
    absent:    'badge-danger',
    wfh:       'bg-teal-100 text-teal-700 badge',
    early_out: 'bg-orange-100 text-orange-600 badge',
    holiday:   'badge-gray',
    leave:     'bg-purple-100 text-purple-600 badge',
  }
  return <span className={cls[code] ?? 'badge-gray'}>{name}</span>
}

function LocationBadge({ valid }: { valid: boolean | null }) {
  if (valid === null)  return <span className="text-gray-300 text-xs">—</span>
  return valid
    ? <span className="badge-success">Dalam Area</span>
    : <span className="badge-danger">Luar Area</span>
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

type StatDef = {
  key:    string
  label:  string
  color:  string
  icon:   React.ReactNode
  value:  number
}

function StatCard({ s, loading }: { s: StatDef; loading: boolean }) {
  return (
    <div className="card p-4 flex flex-col items-center gap-1.5 hover:shadow-md transition-shadow">
      {s.icon}
      <div className={clsx('text-2xl font-bold', s.color)}>
        {loading ? <Loader2 size={18} className="animate-spin text-gray-300" /> : s.value}
      </div>
      <div className="text-[11px] text-gray-500 text-center leading-tight">{s.label}</div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function SummaryReport() {
  const {
    rows, totalCount, stats, chart,
    departments, employees,
    filters, search, setFilters,
    isLoading, isLoadingRows, isLoadingStats, isLoadingChart,
    error, refetch, exportCSV,
  } = useSummaryReport()

  const [showChart,    setShowChart]    = useState(true)
  const [localStart,   setLocalStart]   = useState(filters.startDate)
  const [localEnd,     setLocalEnd]     = useState(filters.endDate)
  const [localDept,    setLocalDept]    = useState('')
  const [localEmployee,setLocalEmployee]= useState('')

  const handleSearch = () => {
    search({
      startDate:    localStart,
      endDate:      localEnd,
      departmentId: localDept    || undefined,
      employeeId:   localEmployee|| undefined,
    })
  }

  // Stats definition
  const statCards: StatDef[] = [
    { key: 'present',   label: 'Hadir',          color: 'text-green-600',  icon: <CheckCircle2 size={18} className="text-green-500" />,  value: stats.total_present },
    { key: 'late',      label: 'Terlambat',       color: 'text-yellow-600', icon: <AlertTriangle size={18} className="text-yellow-500" />, value: stats.total_late },
    { key: 'absent',    label: 'Tidak Hadir',     color: 'text-red-500',    icon: <XCircle size={18} className="text-red-400" />,          value: stats.total_absent },
    { key: 'early_out', label: 'Pulang Awal',     color: 'text-orange-500', icon: <Clock size={18} className="text-orange-400" />,         value: stats.total_early_out },
    { key: 'wfh',       label: 'WFH',             color: 'text-teal-600',   icon: <Users size={18} className="text-teal-500" />,           value: stats.total_wfh },
    { key: 'in_area',   label: 'Dalam Area',      color: 'text-green-600',  icon: <MapPin size={18} className="text-green-500" />,         value: stats.in_area },
    { key: 'out_area',  label: 'Luar Area',       color: 'text-red-500',    icon: <MapPin size={18} className="text-red-400" />,           value: stats.out_of_area },
    { key: 'total',     label: 'Total Records',   color: 'text-gray-700',   icon: <CalendarDays size={18} className="text-gray-400" />,    value: stats.total_records },
  ]

  // Group rows by date for display
  const grouped = rows.reduce<Record<string, AttendanceRow[]>>((acc, r) => {
    acc[r.attendance_date] = acc[r.attendance_date] ?? []
    acc[r.attendance_date].push(r)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const totalPages = Math.ceil(totalCount / (filters.perPage ?? 15))

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Summary Report</h1>
        <div className="flex gap-2">
          <button onClick={refetch} className="btn-icon" title="Refresh">
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-blue-500' : 'text-gray-400'} />
          </button>
          <button onClick={exportCSV} className="btn-secondary text-xs">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Dari Tanggal</label>
          <input type="date" value={localStart} onChange={e => setLocalStart(e.target.value)}
            className="input w-40 text-xs" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Sampai Tanggal</label>
          <input type="date" value={localEnd} onChange={e => setLocalEnd(e.target.value)}
            className="input w-40 text-xs" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Departemen</label>
          <select value={localDept} onChange={e => setLocalDept(e.target.value)} className="select text-xs w-40">
            <option value="">Semua Departemen</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Karyawan</label>
          <select value={localEmployee} onChange={e => setLocalEmployee(e.target.value)} className="select text-xs w-40">
            <option value="">Semua Karyawan</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </div>
        <button onClick={handleSearch} className="btn-primary text-xs">
          Cari
        </button>
        <button onClick={() => setShowChart(v => !v)} className="btn-secondary text-xs ml-auto">
          {showChart ? 'Sembunyikan Chart' : 'Tampilkan Chart'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 xl:grid-cols-8 gap-3">
        {statCards.map(s => (
          <StatCard key={s.key} s={s} loading={isLoadingStats} />
        ))}
      </div>

      {/* Chart */}
      {showChart && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">
              Tren Kehadiran
              <span className="ml-2 text-xs font-normal text-gray-400">
                {localStart} – {localEnd}
              </span>
            </h2>
            {isLoadingChart && <Loader2 size={14} className="animate-spin text-blue-400" />}
          </div>

          {chart.length === 0 && !isLoadingChart ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">
              Tidak ada data untuk periode ini
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="hadir"     name="Hadir"     fill="#22c55e" radius={[3,3,0,0]} maxBarSize={28} />
                <Bar dataKey="terlambat" name="Terlambat" fill="#f59e0b" radius={[3,3,0,0]} maxBarSize={28} />
                <Bar dataKey="absen"     name="Absen"     fill="#ef4444" radius={[3,3,0,0]} maxBarSize={28} />
                <Bar dataKey="wfh"       name="WFH"       fill="#0ea5e9" radius={[3,3,0,0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {/* Table header info */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Menampilkan <strong className="text-gray-700">{rows.length}</strong> dari{' '}
            <strong className="text-gray-700">{totalCount}</strong> records
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Per halaman:</span>
            <select
              value={filters.perPage}
              onChange={e => setFilters({ perPage: Number(e.target.value), page: 1 })}
              className="select text-xs w-16"
            >
              {[15, 25, 50].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Karyawan</th>
                <th className="table-th">Departemen</th>
                <th className="table-th">Check In</th>
                <th className="table-th">Check Out</th>
                <th className="table-th">Status</th>
                <th className="table-th">Terlambat</th>
                <th className="table-th">Jam Kerja</th>
                <th className="table-th">Lokasi Masuk</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingRows && (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <Loader2 size={22} className="animate-spin text-blue-400 mx-auto" />
                    <p className="text-xs text-gray-400 mt-2">Memuat data...</p>
                  </td>
                </tr>
              )}

              {!isLoadingRows && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-sm text-gray-400">
                    Tidak ada data untuk filter yang dipilih
                  </td>
                </tr>
              )}

              {!isLoadingRows && sortedDates.map(date => (
                <>
                  {/* Date group header */}
                  <tr key={`header-${date}`}>
                    <td colSpan={8} className="px-4 py-2 bg-gray-50 border-y border-gray-100">
                      <span className="text-xs font-semibold text-gray-500">
                        📅 {fmtDate(date)}
                      </span>
                    </td>
                  </tr>

                  {grouped[date].map(row => (
                    <tr key={row.id} className="table-tr-hover">
                      {/* Karyawan */}
                      <td className="table-td">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0 overflow-hidden">
                            {row.employees?.photo_url
                              ? <img src={row.employees.photo_url} alt="" className="w-full h-full object-cover" />
                              : <span className="text-white text-[10px] font-bold">
                                  {row.employees?.full_name?.charAt(0) ?? '?'}
                                </span>
                            }
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-800">
                              {row.employees?.full_name ?? '—'}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {row.employees?.positions?.name ?? ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Departemen */}
                      <td className="table-td text-xs text-gray-600">
                        {row.employees?.departments?.name ?? <span className="text-gray-300">—</span>}
                      </td>

                      {/* Check In */}
                      <td className="table-td text-xs font-mono text-gray-700">
                        {fmtTime(row.check_in)}
                      </td>

                      {/* Check Out */}
                      <td className="table-td text-xs font-mono text-gray-700">
                        {fmtTime(row.check_out)}
                      </td>

                      {/* Status */}
                      <td className="table-td">
                        {row.attendance_status
                          ? <StatusBadge code={row.attendance_status.code} name={row.attendance_status.name} />
                          : <span className="text-gray-300 text-xs">—</span>
                        }
                      </td>

                      {/* Terlambat */}
                      <td className="table-td text-xs">
                        {(row.late_minutes ?? 0) > 0
                          ? <span className="text-yellow-600 font-medium">{row.late_minutes} mnt</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>

                      {/* Jam Kerja */}
                      <td className="table-td text-xs font-mono">
                        {row.work_hours != null
                          ? <span className="text-gray-700">{row.work_hours.toFixed(1)} jam</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>

                      {/* Lokasi */}
                      <td className="table-td">
                        <LocationBadge valid={row.check_in_is_valid_location} />
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Halaman {filters.page ?? 1} dari {totalPages || 1}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setFilters({ page: 1 })}
              disabled={(filters.page ?? 1) <= 1} className="btn-icon">«</button>
            <button onClick={() => setFilters({ page: (filters.page ?? 1) - 1 })}
              disabled={(filters.page ?? 1) <= 1} className="btn-icon">‹</button>
            <span className="px-2.5 py-1 text-xs font-medium bg-blue-600 text-white rounded-md">
              {filters.page ?? 1}
            </span>
            <button onClick={() => setFilters({ page: (filters.page ?? 1) + 1 })}
              disabled={(filters.page ?? 1) >= totalPages} className="btn-icon">›</button>
            <button onClick={() => setFilters({ page: totalPages })}
              disabled={(filters.page ?? 1) >= totalPages} className="btn-icon">»</button>
          </div>
        </div>
      </div>
    </div>
  )
}
