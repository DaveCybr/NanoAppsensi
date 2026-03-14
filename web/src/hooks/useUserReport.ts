import { useState, useEffect, useCallback, useRef } from 'react'
import { getUserReportRows, getUserReportStats, type UserReportFilters, type UserReportRow, type UserReportStats } from '../lib/userReportService'
import { getReportFilterOptions, type DepartmentOption, type EmployeeOption } from '../lib/summaryReportService'
import { ensureValidSession } from '../lib/sessionGuard'
import { useAuthStore } from '../stores/authStore'

function today() { return new Date().toISOString().slice(0, 10) }
const EMPTY_STATS: UserReportStats = { total_late_minutes: 0, total_work_hours: 0, total_records: 0 }

export function useUserReport() {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const [filters, setFiltersState] = useState<UserReportFilters>({ startDate: today(), endDate: today(), page: 1, perPage: 15 })
  const [rows, setRows] = useState<UserReportRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState<UserReportStats>(EMPTY_STATS)
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const optionsLoaded = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!tenantId || optionsLoaded.current) return
    optionsLoaded.current = true
    getReportFilterOptions(tenantId).then(({ departments, employees }) => { setDepartments(departments); setEmployees(employees) })
  }, [tenantId])

  const load = useCallback(async (f: UserReportFilters) => {
    if (!tenantId) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller
    setIsLoading(true); setError(null)
    try {
      const valid = await ensureValidSession()
      if (signal.aborted) return
      if (!valid) { setError('Sesi telah berakhir. Silakan refresh halaman.'); return }
      const [rowsRes, statsRes] = await Promise.all([getUserReportRows(tenantId, f), getUserReportStats(tenantId, f)])
      if (signal.aborted) return
      if (rowsRes.error) setError(rowsRes.error)
      else { setRows(rowsRes.data); setTotalCount(rowsRes.count) }
      if (!statsRes.error) setStats(statsRes.data)
    } finally {
      if (!signal.aborted) setIsLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    load(filters)
    return () => { abortRef.current?.abort() }
  }, [filters, load])

  const setFilters = (patch: Partial<UserReportFilters>) => setFiltersState(prev => ({ ...prev, ...patch }))
  const search = (patch: Partial<UserReportFilters>) => setFiltersState(prev => ({ ...prev, ...patch, page: 1 }))

  return { rows, totalCount, stats, departments, employees, filters, setFilters, search, isLoading, error,
    refetch: useCallback(() => load(filters), [load, filters]) }
}
