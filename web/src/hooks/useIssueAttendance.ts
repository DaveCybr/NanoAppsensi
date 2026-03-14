import { useState, useEffect, useCallback, useRef } from 'react'
import { getIssueAttendances, type IssueAttendanceRow, type IssueAttendanceFilters } from '../lib/issueAttendanceService'
import { ensureValidSession } from '../lib/sessionGuard'
import { useAuthStore } from '../stores/authStore'

export function useIssueAttendance(filters: IssueAttendanceFilters = {}) {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const [records, setRecords] = useState<IssueAttendanceRow[]>([])
  const [totalCount, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async (f: IssueAttendanceFilters) => {
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
      const result = await getIssueAttendances(tenantId, f)
      if (signal.aborted) return
      if (result.error) setError(result.error)
      else { setRecords(result.data); setTotal(result.count) }
    } finally {
      if (!signal.aborted) setIsLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    load(filters)
    return () => { abortRef.current?.abort() }
  }, [filters.date, filters.schedule, filters.search, filters.page, filters.perPage, load])

  return { records, totalCount, isLoading, error,
    refetch: useCallback(() => load(filters), [load, filters]) }
}
