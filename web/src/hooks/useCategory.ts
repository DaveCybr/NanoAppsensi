import { useState, useEffect, useCallback, useRef } from 'react'
import { getAttendanceStatuses, updateAttendanceStatus, type AttendanceStatusRow } from '../lib/categoryService'
import { ensureValidSession } from '../lib/sessionGuard'
import { useAuthStore } from '../stores/authStore'

export function useAttendanceStatuses() {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const [statuses, setStatuses] = useState<AttendanceStatusRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    if (!tenantId) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller
    setIsLoading(true); setError(null)
    try {
      const valid = await ensureValidSession()
      if (signal.aborted) return
      if (!valid) return
      const { data, error } = await getAttendanceStatuses()
      if (signal.aborted) return
      if (error) setError(error)
      else setStatuses(data)
    } finally {
      if (!signal.aborted) setIsLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    load()
    return () => { abortRef.current?.abort() }
  }, [load])

  const update = async (id: string, updates: { name?: string; color?: string }) => {
    setIsSaving(true); setSaveError(null)
    const { error } = await updateAttendanceStatus(id, updates)
    setIsSaving(false)
    if (error) { setSaveError(error); return { error } }
    await load(); return { error: null }
  }

  return { statuses, isLoading, error, isSaving, saveError, setSaveError, update, refetch: load }
}
