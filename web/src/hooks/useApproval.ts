import { useState, useEffect, useCallback } from 'react'
import {
  getCorrectionRequests, approveCorrection, rejectCorrection,
  type CorrectionRow, type ApprovalFilters,
} from '../lib/approvalService'
import { useAuthStore } from '../stores/authStore'
import { hasValidSession } from '../lib/sessionGuard'

export function useApproval(filters: ApprovalFilters = {}) {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const userId   = useAuthStore(s => s.user?.id)

  const [records, setRecords]     = useState<CorrectionRow[]>([])
  const [totalCount, setTotal]    = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [isActing, setIsActing]   = useState(false)

  const load = useCallback(async (f: ApprovalFilters) => {
    if (!tenantId) return
    const valid = await hasValidSession()
    if (!valid) return
    setIsLoading(true); setError(null)
    const result = await getCorrectionRequests(tenantId, f)
    if (result.error) setError(result.error)
    else { setRecords(result.data); setTotal(result.count) }
    setIsLoading(false)
  }, [tenantId])

  useEffect(() => { load(filters) }, [JSON.stringify(filters), load])

  const approve = async (id: string) => {
    if (!userId) return
    setIsActing(true)
    const { error } = await approveCorrection(id, userId)
    setIsActing(false)
    if (!error) load(filters)
    return { error }
  }

  const reject = async (id: string) => {
    if (!userId) return
    setIsActing(true)
    const { error } = await rejectCorrection(id, userId)
    setIsActing(false)
    if (!error) load(filters)
    return { error }
  }

  return { records, totalCount, isLoading, error, isActing, approve, reject, refetch: () => load(filters) }
}
