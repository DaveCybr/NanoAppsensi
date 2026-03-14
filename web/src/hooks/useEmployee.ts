import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getEmployees, getEmployeeById, createEmployee,
  updateEmployee, deleteEmployee, toggleEmployeeActive,
  getDepartments, getPositions, getWorkLocations, getManagers,
  type EmployeeFilters, type EmployeeFormData,
} from '../lib/employeeService'
import { supabase } from '../lib/supabase'
import { ensureValidSession } from '../lib/sessionGuard'
import type { EmployeeWithRelations } from '../lib/employeeService'
import { useAuthStore } from '../stores/authStore'

// ─── useEmployeeList ──────────────────────────────────────────────────────────
export function useEmployeeList(initialFilters: EmployeeFilters = {}) {
  const tenantId = useAuthStore(s => s.tenant?.id)

  const [employees,  setEmployees]  = useState<EmployeeWithRelations[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading,  setIsLoading]  = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [filters,    setFilters]    = useState<EmployeeFilters>({ page: 1, perPage: 10, ...initialFilters })

  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async (f: EmployeeFilters) => {
    // Jika tenantId belum ada, jangan set isLoading — tunggu sampai tenantId ada
    if (!tenantId) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller

    // isLoading di-set SETELAH guard tenantId agar tidak stuck saat tenantId undefined
    setIsLoading(true)
    setError(null)

    try {
      const valid = await ensureValidSession()
      if (signal.aborted) return
      if (!valid) { setError('Sesi telah berakhir. Silakan refresh halaman.'); return }

      const result = await getEmployees(f)
      if (signal.aborted) return

      if (result.error) setError(result.error)
      else { setEmployees(result.data); setTotalCount(result.count) }
    } catch (e: any) {
      if (!signal.aborted) setError(e?.message ?? 'Gagal memuat data')
    } finally {
      if (!signal.aborted) setIsLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    load(filters)
    return () => { abortRef.current?.abort() }
  }, [filters, load])

  const refetch = useCallback(() => load(filters), [load, filters])

  const setFilter = (patch: Partial<EmployeeFilters>) => {
    setFilters(prev => ({ ...prev, ...patch, page: patch.page ?? 1 }))
  }

  return { employees, totalCount, isLoading, error, filters, setFilter, refetch }
}

// ─── useEmployeeDetail ────────────────────────────────────────────────────────
export function useEmployeeDetail(id: string | null) {
  const [employee,  setEmployee]  = useState<EmployeeWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!id) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller

    setIsLoading(true)
    getEmployeeById(id).then(({ data, error }) => {
      if (signal.aborted) return
      setEmployee(data)
      setError(error)
    }).finally(() => {
      if (!signal.aborted) setIsLoading(false)
    })

    return () => { abortRef.current?.abort() }
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
    setIsSaving(true); setSaveError(null)
    const { error } = await createEmployee(form, tenantId)
    setIsSaving(false)
    if (error) { setSaveError(error); return { error } }
    onSuccess?.()
    return { error: null }
  }

  const update = async (id: string, form: Partial<EmployeeFormData>) => {
    setIsSaving(true); setSaveError(null)
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

  // Fix: userId bisa undefined jika emp.users null
  const toggleActive = async (userId: string | undefined, isActive: boolean) => {
    if (!userId) return { error: 'User ID tidak ditemukan' }
    const { error } = await toggleEmployeeActive(userId, isActive)
    if (!error) onSuccess?.()
    return { error }
  }

  return { create, update, remove, toggleActive, isSaving, isDeleting, saveError, setSaveError }
}

// ─── useEmployeeFormData ──────────────────────────────────────────────────────
export function useEmployeeFormData() {
  const tenantId = useAuthStore(s => s.tenant?.id)

  const [departments,   setDepartments]   = useState<{ id: string; name: string }[]>([])
  const [positions,     setPositions]     = useState<{ id: string; name: string }[]>([])
  const [workLocations, setWorkLocations] = useState<{ id: string; name: string }[]>([])
  const [managers,      setManagers]      = useState<{ id: string; full_name: string }[]>([])
  const [groups,        setGroups]        = useState<{ id: string; name: string }[]>([])
  const [isLoading,     setIsLoading]     = useState(false)

  // Track tenantId yang sudah di-fetch agar re-fetch jika tenant berubah
  const fetchedForTenant = useRef<string | null>(null)

  useEffect(() => {
    if (!tenantId) return
    if (fetchedForTenant.current === tenantId) return

    fetchedForTenant.current = tenantId
    setIsLoading(true)

    Promise.all([
      getDepartments(tenantId),
      getPositions(tenantId),
      getWorkLocations(tenantId),
      getManagers(tenantId),
      supabase
        .from('groups')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('name'),
    ]).then(([d, p, w, m, g]) => {
      setDepartments(d.data)
      setPositions(p.data)
      setWorkLocations(w.data)
      setManagers(m.data)
      setGroups(g.data ?? [])
    }).catch(() => {
      // Reset agar bisa retry
      fetchedForTenant.current = null
    }).finally(() => {
      setIsLoading(false)
    })
  }, [tenantId])

  return { departments, positions, workLocations, managers, groups, isLoading }
}
