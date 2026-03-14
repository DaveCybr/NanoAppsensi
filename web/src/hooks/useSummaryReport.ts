import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getAttendanceReport, getAttendanceStats, getAttendanceChart,
  getReportFilterOptions, exportAttendanceCSV,
  type AttendanceFilters, type AttendanceRow,
  type SummaryStats, type ChartPoint,
  type DepartmentOption, type EmployeeOption,
} from '../lib/summaryReportService'
import { ensureValidSession } from '../lib/sessionGuard'
import { useAuthStore } from '../stores/authStore'

function today() { return new Date().toISOString().slice(0, 10) }

const EMPTY_STATS: SummaryStats = {
  total_present: 0, total_absent: 0, total_late: 0, total_early_out: 0,
  total_wfh: 0, in_area: 0, out_of_area: 0, total_records: 0,
}

export function useSummaryReport() {
  const tenantId = useAuthStore(s => s.tenant?.id)

  const [filters, setFiltersState] = useState<AttendanceFilters>({
    startDate: today(), endDate: today(), page: 1, perPage: 15,
  })

  const [rows,        setRows]        = useState<AttendanceRow[]>([])
  const [totalCount,  setTotalCount]  = useState(0)
  const [stats,       setStats]       = useState<SummaryStats>(EMPTY_STATS)
  const [chart,       setChart]       = useState<ChartPoint[]>([])
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [employees,   setEmployees]   = useState<EmployeeOption[]>([])

  const [isLoadingRows,  setIsLoadingRows]  = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isLoadingChart, setIsLoadingChart] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filterOptionsLoaded = useRef(false)
  const rowsAbortRef = useRef<AbortController | null>(null)
  const aggAbortRef  = useRef<AbortController | null>(null)

  // Load filter options sekali
  useEffect(() => {
    if (!tenantId || filterOptionsLoaded.current) return
    filterOptionsLoaded.current = true
    getReportFilterOptions(tenantId).then(({ departments, employees }) => {
      setDepartments(departments)
      setEmployees(employees)
    })
  }, [tenantId])

  const loadRows = useCallback(async (f: AttendanceFilters) => {
    if (!tenantId) return
    rowsAbortRef.current?.abort()
    const controller = new AbortController()
    rowsAbortRef.current = controller
    const { signal } = controller

    setIsLoadingRows(true)
    setError(null)
    try {
      const valid = await ensureValidSession()
      if (signal.aborted) return
      if (!valid) { setError('Sesi telah berakhir. Silakan refresh halaman.'); return }

      const { data, count, error } = await getAttendanceReport(tenantId, f)
      if (signal.aborted) return
      if (error) setError(error)
      else { setRows(data); setTotalCount(count) }
    } finally {
      if (!signal.aborted) setIsLoadingRows(false)
    }
  }, [tenantId])

  const loadAggregates = useCallback(async (f: AttendanceFilters) => {
    if (!tenantId) return
    aggAbortRef.current?.abort()
    const controller = new AbortController()
    aggAbortRef.current = controller
    const { signal } = controller

    setIsLoadingStats(true)
    setIsLoadingChart(true)
    try {
      const valid = await ensureValidSession()
      if (signal.aborted) return
      if (!valid) { setIsLoadingStats(false); setIsLoadingChart(false); return }

      const [statsRes, chartRes] = await Promise.all([
        getAttendanceStats(tenantId, f.startDate, f.endDate, f.departmentId),
        getAttendanceChart(tenantId, f.startDate, f.endDate),
      ])
      if (signal.aborted) return
      if (statsRes.error) setError(statsRes.error)
      else setStats(statsRes.data)
      if (!chartRes.error) setChart(chartRes.data)
    } finally {
      if (!signal.aborted) { setIsLoadingStats(false); setIsLoadingChart(false) }
    }
  }, [tenantId])

  useEffect(() => {
    loadRows(filters)
    return () => { rowsAbortRef.current?.abort() }
  }, [filters, loadRows])

  // Aggregates hanya re-fetch saat date/dept berubah, bukan saat page berubah
  useEffect(() => {
    loadAggregates(filters)
    return () => { aggAbortRef.current?.abort() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate, filters.departmentId, loadAggregates])

  const setFilters = (patch: Partial<AttendanceFilters>) =>
    setFiltersState(prev => ({ ...prev, ...patch }))

  const search = (patch: Partial<AttendanceFilters>) =>
    setFiltersState(prev => ({ ...prev, ...patch, page: 1 }))

  const refetch = useCallback(() => {
    loadRows(filters)
    loadAggregates(filters)
  }, [filters, loadRows, loadAggregates])

  const exportCSV = () =>
    exportAttendanceCSV(rows, `absensi_${filters.startDate}_${filters.endDate}`)

  return {
    rows, totalCount, stats, chart, departments, employees,
    filters, setFilters, search,
    isLoading: isLoadingRows || isLoadingStats,
    isLoadingRows, isLoadingStats, isLoadingChart, error,
    refetch, exportCSV,
  }
}
