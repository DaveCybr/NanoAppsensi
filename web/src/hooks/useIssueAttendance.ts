import { useState, useEffect, useCallback } from 'react'
import { getIssueAttendances, type IssueAttendanceRow, type IssueAttendanceFilters } from '../lib/issueAttendanceService'
import { useAuthStore } from '../stores/authStore'
export function useIssueAttendance(filters: IssueAttendanceFilters = {}) {
  const tenantId = useAuthStore(s => s.tenant?.id)

  const [records, setRecords]     = useState<IssueAttendanceRow[]>([])
  const [totalCount, setTotal]    = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const load = useCallback(async (f: IssueAttendanceFilters) => {
    if (!tenantId) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await getIssueAttendances(tenantId, f)
      if (result.error) setError(result.error)
      else {
        setRecords(result.data)
        setTotal(result.count)
      }
    } finally {
      setIsLoading(false)
    }
  }, [tenantId])

  useEffect(() => { load(filters) }, [JSON.stringify(filters), load])

  return { records, totalCount, isLoading, error, refetch: () => load(filters) }
}
