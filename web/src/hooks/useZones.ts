import { useState, useEffect, useCallback } from 'react'
import {
  getZones, createZone, updateZone, deleteZone,
  type ZoneRow, type ZoneFormData,
} from '../lib/zonesService'
import { useAuthStore } from '../stores/authStore'
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
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await getZones(tenantId)
      if (error) setError(error)
      else setZones(data)
    } finally {
      setIsLoading(false)
    }
  }, [tenantId])

  useEffect(() => { load() }, [load])

  const create = async (form: ZoneFormData) => {
    if (!tenantId) return { error: 'Tenant tidak ditemukan' }
    setIsSaving(true); setSaveError(null)
    try {
      const { error } = await createZone(tenantId, form)
      if (error) { setSaveError(error); return { error } }
      await load()
      return { error: null }
    } catch (e: any) {
      const msg = e?.message ?? 'Gagal menyimpan'
      setSaveError(msg)
      return { error: msg }
    } finally {
      setIsSaving(false)
    }
  }

  const update = async (id: string, form: ZoneFormData) => {
    setIsSaving(true); setSaveError(null)
    try {
      const { error } = await updateZone(id, form)
      if (error) { setSaveError(error); return { error } }
      await load()
      return { error: null }
    } catch (e: any) {
      const msg = e?.message ?? 'Gagal menyimpan'
      setSaveError(msg)
      return { error: msg }
    } finally {
      setIsSaving(false)
    }
  }

  const remove = async (id: string) => {
    setIsDeleting(true)
    try {
      const { error } = await deleteZone(id)
      if (!error) await load()
      return { error }
    } catch (e: any) {
      return { error: e?.message ?? 'Gagal menghapus' }
    } finally {
      setIsDeleting(false)
    }
  }

  return { zones, isLoading, error, isSaving, isDeleting, saveError, setSaveError, create, update, remove, refetch: load }
}
