import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getAttendanceReport, getAttendanceStats, getAttendanceChart,
  getReportFilterOptions, exportAttendanceCSV,
  type AttendanceFilters, type AttendanceRow,
  type SummaryStats, type ChartPoint,
  type DepartmentOption, type EmployeeOption,
} from '../lib/summaryReportService'
import { useAuthStore } from '../stores/authStore'
// ── today string ──────────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10)
}

// ── Default stats ──────────────────────────────────────────────────────────────
const EMPTY_STATS: SummaryStats = {
  total_present: 0, total_absent: 0, total_late: 0, total_early_out: 0,
  total_wfh: 0, in_area: 0, out_of_area: 0, total_records: 0,
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useSummaryReport() {
  const tenantId = useAuthStore(s => s.tenant?.id)

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filters, setFiltersState] = useState<AttendanceFilters>({
    startDate:  today(),
    endDate:    today(),
    page:       1,
    perPage:    15,
  })

  // ── Data state ────────────────────────────────────────────────────────────
  const [rows,       setRows]       = useState<AttendanceRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [stats,      setStats]      = useState<SummaryStats>(EMPTY_STATS)
  const [chart,      setChart]      = useState<ChartPoint[]>([])
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [employees,   setEmployees]   = useState<EmployeeOption[]>([])

  // ── Loading / error ────────────────────────────────────────────────────────
  const [isLoadingRows,  setIsLoadingRows]  = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isLoadingChart, setIsLoadingChart] = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  const filterOptionsLoaded = useRef(false)

  // ── Load filter options once ───────────────────────────────────────────────
  useEffect(() => {
    if (!tenantId || filterOptionsLoaded.current) return
    filterOptionsLoaded.current = true
    getReportFilterOptions(tenantId).then(({ departments, employees }) => {
      setDepartments(departments)
      setEmployees(employees)
    })
  }, [tenantId])

  // ── Load table rows ────────────────────────────────────────────────────────
  const loadRows = useCallback(async (f: AttendanceFilters) => {
    if (!tenantId) return
    setIsLoadingRows(true)
    setError(null)
    try {
      const { data, count, error } = await getAttendanceReport(tenantId, f)
      if (error) setError(error)
      else { setRows(data); setTotalCount(count) }
    } finally {
      setIsLoadingRows(false)
    }
  }, [tenantId])

  // ── Load stats + chart (only when date/dept filter changes) ───────────────
  const loadAggregates = useCallback(async (f: AttendanceFilters) => {
    if (!tenantId) return
    setIsLoadingStats(true)
    setIsLoadingChart(true)

    const [statsRes, chartRes] = await Promise.all([
      getAttendanceStats(tenantId, f.startDate, f.endDate, f.departmentId),
      getAttendanceChart(tenantId, f.startDate, f.endDate),
    ])

    if (statsRes.error) setError(statsRes.error)
    else setStats(statsRes.data)
    setIsLoadingStats(false)

    if (!chartRes.error) setChart(chartRes.data)
    setIsLoadingChart(false)
  }, [tenantId])

  // ── Trigger on filter change ───────────────────────────────────────────────
  useEffect(() => {
    loadRows(filters)
  }, [filters, loadRows])

  // Aggregates only re-fetch when date/dept changes (not page/employee)
  const prevAggKey = useRef('')
  useEffect(() => {
    const key = `${filters.startDate}|${filters.endDate}|${filters.departmentId ?? ''}`
    if (key === prevAggKey.current) return
    prevAggKey.current = key
    loadAggregates(filters)
  }, [filters, loadAggregates])

  // ── Public helpers ─────────────────────────────────────────────────────────
  const setFilters = (patch: Partial<AttendanceFilters>) => {
    setFiltersState(prev => ({ ...prev, ...patch }))
  }

  const search = (patch: Partial<AttendanceFilters>) => {
    setFiltersState(prev => ({ ...prev, ...patch, page: 1 }))
  }

  const refetch = () => {
    loadRows(filters)
    loadAggregates(filters)
  }

  const exportCSV = () => {
    // Export current page rows; for full export could fetch all pages
    const label = `absensi_${filters.startDate}_${filters.endDate}`
    exportAttendanceCSV(rows, label)
  }

  const isLoading = isLoadingRows || isLoadingStats

  return {
    // Data
    rows, totalCount, stats, chart,
    departments, employees,
    // Filters
    filters, setFilters, search,
    // State
    isLoading, isLoadingRows, isLoadingStats, isLoadingChart, error,
    // Actions
    refetch, exportCSV,
  }
}
