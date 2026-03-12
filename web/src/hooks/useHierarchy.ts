import { useState, useEffect, useCallback } from 'react'
import {
  getPositionList, createPosition, updatePosition, deletePosition,
  getGradeList, createGrade, updateGrade, deleteGrade,
  getEmploymentStatusList, createEmploymentStatus, updateEmploymentStatus, deleteEmploymentStatus,
  type PositionRow, type GradeRow, type EmploymentStatusRow,
} from '../lib/hierarchyService'
import { useAuthStore } from '../stores/authStore'

// ─── usePositionList ──────────────────────────────────────────────────────────
export function usePositionList() {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const [positions, setPositions] = useState<PositionRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!tenantId) return
    setIsLoading(true)
    setError(null)
    const { data, error } = await getPositionList(tenantId)
    if (error) setError(error)
    else setPositions(data)
    setIsLoading(false)
  }, [tenantId])

  useEffect(() => { load() }, [load])

  return { positions, isLoading, error, refetch: load }
}

export function usePositionMutations(onSuccess?: () => void) {
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const tenantId = useAuthStore(s => s.tenant?.id)

  const create = async (name: string) => {
    if (!tenantId) return { error: 'Tenant tidak ditemukan' }
    setIsSaving(true); setSaveError(null)
    const { error } = await createPosition(tenantId, name)
    setIsSaving(false)
    if (error) { setSaveError(error); return { error } }
    onSuccess?.()
    return { error: null }
  }

  const update = async (id: string, name: string) => {
    setIsSaving(true); setSaveError(null)
    const { error } = await updatePosition(id, name)
    setIsSaving(false)
    if (error) { setSaveError(error); return { error } }
    onSuccess?.()
    return { error: null }
  }

  const remove = async (id: string) => {
    setIsDeleting(true)
    const { error } = await deletePosition(id)
    setIsDeleting(false)
    if (!error) onSuccess?.()
    return { error }
  }

  return { create, update, remove, isSaving, isDeleting, saveError, setSaveError }
}

// ─── useGradeList ─────────────────────────────────────────────────────────────
export function useGradeList() {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const [grades, setGrades] = useState<GradeRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!tenantId) return
    setIsLoading(true)
    setError(null)
    const { data, error } = await getGradeList(tenantId)
    if (error) setError(error)
    else setGrades(data)
    setIsLoading(false)
  }, [tenantId])

  useEffect(() => { load() }, [load])

  return { grades, isLoading, error, refetch: load }
}

export function useGradeMutations(onSuccess?: () => void) {
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const tenantId = useAuthStore(s => s.tenant?.id)

  const create = async (code: string, name: string) => {
    if (!tenantId) return { error: 'Tenant tidak ditemukan' }
    setIsSaving(true); setSaveError(null)
    const { error } = await createGrade(tenantId, code, name)
    setIsSaving(false)
    if (error) { setSaveError(error); return { error } }
    onSuccess?.()
    return { error: null }
  }

  const update = async (id: string, code: string, name: string) => {
    setIsSaving(true); setSaveError(null)
    const { error } = await updateGrade(id, code, name)
    setIsSaving(false)
    if (error) { setSaveError(error); return { error } }
    onSuccess?.()
    return { error: null }
  }

  const remove = async (id: string) => {
    setIsDeleting(true)
    const { error } = await deleteGrade(id)
    setIsDeleting(false)
    if (!error) onSuccess?.()
    return { error }
  }

  return { create, update, remove, isSaving, isDeleting, saveError, setSaveError }
}

// ─── useEmploymentStatusList ──────────────────────────────────────────────────
export function useEmploymentStatusList() {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const [statuses, setStatuses] = useState<EmploymentStatusRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!tenantId) return
    setIsLoading(true)
    setError(null)
    const { data, error } = await getEmploymentStatusList(tenantId)
    if (error) setError(error)
    else setStatuses(data)
    setIsLoading(false)
  }, [tenantId])

  useEffect(() => { load() }, [load])

  return { statuses, isLoading, error, refetch: load }
}

export function useEmploymentStatusMutations(onSuccess?: () => void) {
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const tenantId = useAuthStore(s => s.tenant?.id)

  const create = async (code: string, name: string) => {
    if (!tenantId) return { error: 'Tenant tidak ditemukan' }
    setIsSaving(true); setSaveError(null)
    const { error } = await createEmploymentStatus(tenantId, code, name)
    setIsSaving(false)
    if (error) { setSaveError(error); return { error } }
    onSuccess?.()
    return { error: null }
  }

  const update = async (id: string, code: string, name: string) => {
    setIsSaving(true); setSaveError(null)
    const { error } = await updateEmploymentStatus(id, code, name)
    setIsSaving(false)
    if (error) { setSaveError(error); return { error } }
    onSuccess?.()
    return { error: null }
  }

  const remove = async (id: string) => {
    setIsDeleting(true)
    const { error } = await deleteEmploymentStatus(id)
    setIsDeleting(false)
    if (!error) onSuccess?.()
    return { error }
  }

  return { create, update, remove, isSaving, isDeleting, saveError, setSaveError }
}
