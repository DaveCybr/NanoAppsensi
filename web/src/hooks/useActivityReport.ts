import { useState, useEffect, useCallback, useRef } from 'react'
import { getActivityReportRows, type ActivityReportFilters, type ActivityRow } from '../lib/activityReportService'
import { getReportFilterOptions, type DepartmentOption } from '../lib/summaryReportService'
import { ensureValidSession } from '../lib/sessionGuard'
import { useAuthStore } from '../stores/authStore'

function today() { return new Date().toISOString().slice(0, 10) }

export function useActivityReport() {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const [filters, setFiltersState] = useState<ActivityReportFilters>({ startDate: today(), endDate: today(), page: 1, perPage: 20 })
  const [rows, setRows] = useState<ActivityRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const optionsLoaded = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!tenantId || optionsLoaded.current) return
    optionsLoaded.current = true
    getReportFilterOptions(tenantId).then(({ departments }) => setDepartments(departments))
  }, [tenantId])

  const load = useCallback(async (f: ActivityReportFilters) => {
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
      const { data, count, error } = await getActivityReportRows(tenantId, f)
      if (signal.aborted) return
      if (error) setError(error)
      else { setRows(data); setTotalCount(count) }
    } finally {
      if (!signal.aborted) setIsLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    load(filters)
    return () => { abortRef.current?.abort() }
  }, [filters, load])

  const setFilters = (patch: Partial<ActivityReportFilters>) => setFiltersState(prev => ({ ...prev, ...patch }))
  const search = (patch: Partial<ActivityReportFilters>) => setFiltersState(prev => ({ ...prev, ...patch, page: 1 }))

  return { rows, totalCount, departments, filters, setFilters, search, isLoading, error,
    refetch: useCallback(() => load(filters), [load, filters]) }
}
