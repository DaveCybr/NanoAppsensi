import { useState, useEffect, useCallback } from 'react'
import {
  getLeaveRequests, approveLeave, rejectLeave,
  type LeaveRow, type LeaveFilters,
} from '../lib/leaveService'
import { useAuthStore } from '../stores/authStore'
import { hasValidSession } from '../lib/sessionGuard'

export function useLeave(filters: LeaveFilters = {}) {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const userId   = useAuthStore(s => s.user?.id)

  const [records, setRecords]     = useState<LeaveRow[]>([])
  const [totalCount, setTotal]    = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [isActing, setIsActing]   = useState(false)

  const load = useCallback(async (f: LeaveFilters) => {
    if (!tenantId) return
    const valid = await hasValidSession()
    if (!valid) return
    setIsLoading(true)
    setError(null)
    const result = await getLeaveRequests(tenantId, f)
    if (result.error) setError(result.error)
    else { setRecords(result.data); setTotal(result.count) }
    setIsLoading(false)
  }, [tenantId])

  useEffect(() => { load(filters) }, [JSON.stringify(filters), load])

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

  return { records, totalCount, isLoading, error, isActing, approve, reject, refetch: () => load(filters) }
}
