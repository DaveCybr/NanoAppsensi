import { useState, useEffect, useCallback } from 'react'
import { getIssueAttendances, type IssueAttendanceRow, type IssueAttendanceFilters } from '../lib/issueAttendanceService'
import { useAuthStore } from '../stores/authStore'
import { hasValidSession } from '../lib/sessionGuard'

export function useIssueAttendance(filters: IssueAttendanceFilters = {}) {
  const tenantId = useAuthStore(s => s.tenant?.id)

  const [records, setRecords]     = useState<IssueAttendanceRow[]>([])
  const [totalCount, setTotal]    = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const load = useCallback(async (f: IssueAttendanceFilters) => {
    if (!tenantId) return
    const valid = await hasValidSession()
    if (!valid) return
    setIsLoading(true)
    setError(null)
    const result = await getIssueAttendances(tenantId, f)
    if (result.error) setError(result.error)
    else {
      setRecords(result.data)
      setTotal(result.count)
    }
    setIsLoading(false)
  }, [tenantId])

  useEffect(() => { load(filters) }, [JSON.stringify(filters), load])

  return { records, totalCount, isLoading, error, refetch: () => load(filters) }
}
