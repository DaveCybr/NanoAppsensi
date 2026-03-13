import { useState, useEffect, useCallback } from 'react'
import {
  getZones, createZone, updateZone, deleteZone,
  type ZoneRow, type ZoneFormData,
} from '../lib/zonesService'
import { useAuthStore } from '../stores/authStore'
import { hasValidSession } from '../lib/sessionGuard'

export function useZones() {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const [zones, setZones] = useState<ZoneRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!tenantId) return
    const valid = await hasValidSession()
    if (!valid) return
    setIsLoading(true)
    setError(null)
    const { data, error } = await getZones(tenantId)
    if (error) setError(error)
    else setZones(data)
    setIsLoading(false)
  }, [tenantId])

  useEffect(() => { load() }, [load])

  const create = async (form: ZoneFormData) => {
    if (!tenantId) return { error: 'Tenant tidak ditemukan' }
    setIsSaving(true); setSaveError(null)
    const { error } = await createZone(tenantId, form)
    setIsSaving(false)
    if (error) { setSaveError(error); return { error } }
    await load()
    return { error: null }
  }

  const update = async (id: string, form: ZoneFormData) => {
    setIsSaving(true); setSaveError(null)
    const { error } = await updateZone(id, form)
    setIsSaving(false)
    if (error) { setSaveError(error); return { error } }
    await load()
    return { error: null }
  }

  const remove = async (id: string) => {
    setIsDeleting(true)
    const { error } = await deleteZone(id)
    setIsDeleting(false)
    if (!error) await load()
    return { error }
  }

  return { zones, isLoading, error, isSaving, isDeleting, saveError, setSaveError, create, update, remove, refetch: load }
}
