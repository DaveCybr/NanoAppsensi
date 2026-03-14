import { useState, useEffect, useCallback, useRef } from 'react'
import { getLeaveRequests, approveLeave, rejectLeave, type LeaveRow, type LeaveFilters } from '../lib/leaveService'
import { ensureValidSession } from '../lib/sessionGuard'
import { useAuthStore } from '../stores/authStore'

export function useLeave(filters: LeaveFilters = {}) {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const userId   = useAuthStore(s => s.user?.id)
  const [records, setRecords] = useState<LeaveRow[]>([])
  const [totalCount, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isActing, setIsActing] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async (f: LeaveFilters) => {
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
      const result = await getLeaveRequests(tenantId, f)
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
  }, [filters.status, filters.search, filters.page, filters.perPage, load])

  const approve = async (id: string) => {
    if (!userId) return
    setIsActing(true)
    const { error } = await approveLeave(id, userId)
    setIsActing(false)
    if (!error) load(filters)
    return { error }
  }

  const reject = async (id: string, reason?: string) => {
    setIsActing(true)
    const { error } = await rejectLeave(id, reason)
    setIsActing(false)
    if (!error) load(filters)
    return { error }
  }

  return { records, totalCount, isLoading, error, isActing, approve, reject,
    refetch: useCallback(() => load(filters), [load, filters]) }
}
