import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getActivityReportRows,
  type ActivityReportFilters, type ActivityRow,
} from '../lib/activityReportService'
import { getReportFilterOptions, type DepartmentOption } from '../lib/summaryReportService'
import { useAuthStore } from '../stores/authStore'

function today() { return new Date().toISOString().slice(0, 10) }

export function useActivityReport() {
  const tenantId = useAuthStore(s => s.tenant?.id)

  const [filters, setFiltersState] = useState<ActivityReportFilters>({
    startDate: today(), endDate: today(), page: 1, perPage: 20,
  })

  const [rows,        setRows]        = useState<ActivityRow[]>([])
  const [totalCount,  setTotalCount]  = useState(0)
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [isLoading,   setIsLoading]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const optionsLoaded = useRef(false)

  useEffect(() => {
    if (!tenantId || optionsLoaded.current) return
    optionsLoaded.current = true
    getReportFilterOptions(tenantId).then(({ departments }) => setDepartments(departments))
  }, [tenantId])

  const load = useCallback(async (f: ActivityReportFilters) => {
    if (!tenantId) return
    setIsLoading(true); setError(null)
    const { data, count, error } = await getActivityReportRows(tenantId, f)
    if (error) setError(error)
    else { setRows(data); setTotalCount(count) }
    setIsLoading(false)
  }, [tenantId])

  useEffect(() => { load(filters) }, [filters, load])

  const setFilters = (patch: Partial<ActivityReportFilters>) =>
    setFiltersState(prev => ({ ...prev, ...patch }))

  const search = (patch: Partial<ActivityReportFilters>) =>
    setFiltersState(prev => ({ ...prev, ...patch, page: 1 }))

  return {
    rows, totalCount, departments,
    filters, setFilters, search,
    isLoading, error,
    refetch: () => load(filters),
  }
}
