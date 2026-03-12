import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getEmployees, getEmployeeById, createEmployee,
  updateEmployee, deleteEmployee, toggleEmployeeActive,
  getDepartments, getPositions, getWorkLocations, getManagers,
  type EmployeeFilters, type EmployeeFormData,
} from '../lib/employeeService'
import type { EmployeeWithRelations } from '../types/database.types'
import { useAuthStore } from '../stores/authStore'

// ─── useEmployeeList ──────────────────────────────────────────────────────────
export function useEmployeeList(initialFilters: EmployeeFilters = {}) {
  const tenantId = useAuthStore(s => s.tenant?.id)

  const [employees, setEmployees] = useState<EmployeeWithRelations[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [filters, setFilters]       = useState<EmployeeFilters>({ page: 1, perPage: 10, ...initialFilters })

  const load = useCallback(async (f: EmployeeFilters) => {
    if (!tenantId) return
    setIsLoading(true)
    setError(null)
    const result = await getEmployees(f)
    if (result.error) {
      setError(result.error)
    } else {
      setEmployees(result.data)
      setTotalCount(result.count)
    }
    setIsLoading(false)
  }, [tenantId])

  useEffect(() => { load(filters) }, [filters, load])

  const refetch = () => load(filters)

  const setFilter = (patch: Partial<EmployeeFilters>) => {
    setFilters(prev => ({ ...prev, ...patch, page: patch.page ?? 1 }))
  }

  return { employees, totalCount, isLoading, error, filters, setFilter, refetch }
}

// ─── useEmployeeDetail ────────────────────────────────────────────────────────
export function useEmployeeDetail(id: string | null) {
  const [employee, setEmployee] = useState<EmployeeWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    getEmployeeById(id).then(({ data, error }) => {
      setEmployee(data)
      setError(error)
      setIsLoading(false)
    })
  }, [id])

  return { employee, isLoading, error }
}

// ─── useEmployeeMutations ─────────────────────────────────────────────────────
export function useEmployeeMutations(onSuccess?: () => void) {
  const tenantId = useAuthStore(s => s.tenant?.id)

  const [isSaving,   setIsSaving]   = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveError,  setSaveError]  = useState<string | null>(null)

  const create = async (form: EmployeeFormData) => {
    if (!tenantId) return { error: 'Tenant tidak ditemukan' }
    setIsSaving(true)
    setSaveError(null)
    const { error } = await createEmployee(form, tenantId)
    setIsSaving(false)
    if (error) { setSaveError(error); return { error } }
    onSuccess?.()
    return { error: null }
  }

  const update = async (id: string, form: Partial<EmployeeFormData>) => {
    setIsSaving(true)
    setSaveError(null)
    const { error } = await updateEmployee(id, form)
    setIsSaving(false)
    if (error) { setSaveError(error); return { error } }
    onSuccess?.()
    return { error: null }
  }

  const remove = async (id: string) => {
    setIsDeleting(true)
    const { error } = await deleteEmployee(id)
    setIsDeleting(false)
    if (!error) onSuccess?.()
    return { error }
  }

  const toggleActive = async (userId: string, isActive: boolean) => {
    const { error } = await toggleEmployeeActive(userId, isActive)
    if (!error) onSuccess?.()
    return { error }
  }

  return { create, update, remove, toggleActive, isSaving, isDeleting, saveError, setSaveError }
}

// ─── useEmployeeFormData (departments, positions, etc.) ───────────────────────
export function useEmployeeFormData() {
  const tenantId = useAuthStore(s => s.tenant?.id)

  const [departments,    setDepartments]    = useState<{ id: string; name: string }[]>([])
  const [positions,      setPositions]      = useState<{ id: string; name: string }[]>([])
  const [workLocations,  setWorkLocations]  = useState<{ id: string; name: string }[]>([])
  const [managers,       setManagers]       = useState<{ id: string; full_name: string }[]>([])
  const [isLoading,      setIsLoading]      = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!tenantId || fetchedRef.current) return
    fetchedRef.current = true
    setIsLoading(true)
    Promise.all([
      getDepartments(tenantId),
      getPositions(tenantId),
      getWorkLocations(tenantId),
      getManagers(tenantId),
    ]).then(([d, p, w, m]) => {
      setDepartments(d.data)
      setPositions(p.data)
      setWorkLocations(w.data)
      setManagers(m.data)
      setIsLoading(false)
    })
  }, [tenantId])

  return { departments, positions, workLocations, managers, isLoading }
}
