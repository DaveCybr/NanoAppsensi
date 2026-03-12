import { useState, useEffect, useCallback } from 'react'
import {
  getAttendanceStatuses, updateAttendanceStatus,
  type AttendanceStatusRow,
} from '../lib/categoryService'
import { useAuthStore } from '../stores/authStore'

export function useAttendanceStatuses() {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const [statuses, setStatuses]   = useState<AttendanceStatusRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [isSaving, setIsSaving]   = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!tenantId) return
    setIsLoading(true); setError(null)
    const { data, error } = await getAttendanceStatuses()
    if (error) setError(error)
    else setStatuses(data)
    setIsLoading(false)
  }, [tenantId])

  useEffect(() => { load() }, [load])

  const update = async (id: string, updates: { name?: string; color?: string }) => {
    setIsSaving(true); setSaveError(null)
    const { error } = await updateAttendanceStatus(id, updates)
    setIsSaving(false)
    if (error) { setSaveError(error); return { error } }
    await load()
    return { error: null }
  }

  return { statuses, isLoading, error, isSaving, saveError, setSaveError, update, refetch: load }
}
