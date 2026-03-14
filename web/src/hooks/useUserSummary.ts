import { useState, useEffect, useCallback, useRef } from 'react'
import { getUserSummaryRows, type UserSummaryFilters, type UserSummaryRow } from '../lib/userSummaryService'
import { getReportFilterOptions, type DepartmentOption, type EmployeeOption } from '../lib/summaryReportService'
import { ensureValidSession } from '../lib/sessionGuard'
import { useAuthStore } from '../stores/authStore'

function today() { return new Date().toISOString().slice(0, 10) }

export function useUserSummary() {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const [filters, setFiltersState] = useState<UserSummaryFilters>({ startDate: today(), endDate: today(), page: 1, perPage: 15 })
  const [rows, setRows] = useState<UserSummaryRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
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

  const load = useCallback(async (f: UserSummaryFilters) => {
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
      const { data, count, error } = await getUserSummaryRows(tenantId, f)
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

  const setFilters = (patch: Partial<UserSummaryFilters>) => setFiltersState(prev => ({ ...prev, ...patch }))
  const search = (patch: Partial<UserSummaryFilters>) => setFiltersState(prev => ({ ...prev, ...patch, page: 1 }))

  return { rows, totalCount, departments, employees, filters, setFilters, search, isLoading, error,
    refetch: useCallback(() => load(filters), [load, filters]) }
}
