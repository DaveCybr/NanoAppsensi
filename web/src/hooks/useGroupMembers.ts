import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getGroupMembers, getAvailableEmployees, assignMembers, removeMember,
  type MemberRow, type AvailableEmployee, type MemberFilters,
} from '../lib/groupMemberService'
import { ensureValidSession } from '../lib/sessionGuard'
import { useAuthStore } from '../stores/authStore'

// ─── useGroupMembers ──────────────────────────────────────────────────────────
export function useGroupMembers(groupId: string | null) {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<MemberFilters>({ page: 1, perPage: 10 })
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async (f: MemberFilters) => {
    if (!tenantId || !groupId) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller
    setIsLoading(true)
    try {
      const valid = await ensureValidSession()
      if (signal.aborted) return
      if (!valid) return
      const result = await getGroupMembers(tenantId, groupId, f)
      if (signal.aborted) return
      if (result.error) setError(result.error)
      else { setMembers(result.data); setTotalCount(result.count) }
    } finally {
      if (!signal.aborted) setIsLoading(false)
    }
  }, [tenantId, groupId])

  useEffect(() => {
    load(filters)
    return () => { abortRef.current?.abort() }
  }, [filters, load])

  const refetch = useCallback(() => load(filters), [load, filters])
  const setFilter = useCallback((patch: Partial<MemberFilters>) => {
    setFiltersState(prev => ({ ...prev, ...patch, page: patch.page ?? 1 }))
  }, [])

  return { members, totalCount, isLoading, error, filters, setFilter, refetch }
}

// ─── useAvailableEmployees ────────────────────────────────────────────────────
export function useAvailableEmployees(groupId: string | null) {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const [employees, setEmployees] = useState<AvailableEmployee[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<MemberFilters>({ page: 1, perPage: 10 })
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async (f: MemberFilters) => {
    if (!tenantId || !groupId) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller
    setIsLoading(true)
    try {
      const valid = await ensureValidSession()
      if (signal.aborted) return
      if (!valid) return
      const result = await getAvailableEmployees(tenantId, groupId, f)
      if (signal.aborted) return
      if (result.error) setError(result.error)
      else { setEmployees(result.data); setTotalCount(result.count) }
    } finally {
      if (!signal.aborted) setIsLoading(false)
    }
  }, [tenantId, groupId])

  useEffect(() => {
    load(filters)
    return () => { abortRef.current?.abort() }
  }, [filters, load])

  const setFilter = useCallback((patch: Partial<MemberFilters>) => {
    setFiltersState(prev => ({ ...prev, ...patch, page: patch.page ?? 1 }))
  }, [])

  return { employees, totalCount, isLoading, error, filters, setFilter }
}

// ─── useGroupMemberMutations ──────────────────────────────────────────────────
export function useGroupMemberMutations(onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const assign = async (employeeIds: string[], groupId: string) => {
    setIsLoading(true); setError(null)
    const result = await assignMembers(employeeIds, groupId)
    setIsLoading(false)
    if (result.error) setError(result.error)
    else onSuccess?.()
    return result
  }

  const remove = async (employeeId: string) => {
    setIsLoading(true); setError(null)
    const result = await removeMember(employeeId)
    setIsLoading(false)
    if (result.error) setError(result.error)
    else onSuccess?.()
    return result
  }

  return { assign, remove, isLoading, error }
}
