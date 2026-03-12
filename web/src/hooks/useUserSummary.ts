import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getUserSummaryRows,
  type UserSummaryFilters, type UserSummaryRow,
} from '../lib/userSummaryService'
import { getReportFilterOptions, type DepartmentOption, type EmployeeOption } from '../lib/summaryReportService'
import { useAuthStore } from '../stores/authStore'

function today() { return new Date().toISOString().slice(0, 10) }

export function useUserSummary() {
  const tenantId = useAuthStore(s => s.tenant?.id)

  const [filters, setFiltersState] = useState<UserSummaryFilters>({
    startDate: today(), endDate: today(), page: 1, perPage: 15,
  })

  const [rows,        setRows]        = useState<UserSummaryRow[]>([])
  const [totalCount,  setTotalCount]  = useState(0)
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [employees,   setEmployees]   = useState<EmployeeOption[]>([])
  const [isLoading,   setIsLoading]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const optionsLoaded = useRef(false)

  useEffect(() => {
    if (!tenantId || optionsLoaded.current) return
    optionsLoaded.current = true
    getReportFilterOptions(tenantId).then(({ departments, employees }) => {
      setDepartments(departments)
      setEmployees(employees)
    })
  }, [tenantId])

  const load = useCallback(async (f: UserSummaryFilters) => {
    if (!tenantId) return
    setIsLoading(true); setError(null)
    const { data, count, error } = await getUserSummaryRows(tenantId, f)
    if (error) setError(error)
    else { setRows(data); setTotalCount(count) }
    setIsLoading(false)
  }, [tenantId])

  useEffect(() => { load(filters) }, [filters, load])

  const setFilters = (patch: Partial<UserSummaryFilters>) =>
    setFiltersState(prev => ({ ...prev, ...patch }))

  const search = (patch: Partial<UserSummaryFilters>) =>
    setFiltersState(prev => ({ ...prev, ...patch, page: 1 }))

  return {
    rows, totalCount, departments, employees,
    filters, setFilters, search,
    isLoading, error,
    refetch: () => load(filters),
  }
}
