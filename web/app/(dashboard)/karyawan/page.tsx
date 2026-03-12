"use client"

import React, { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmployeeTable } from '@/components/karyawan/EmployeeTable'
import { EmployeeDrawer } from '@/components/karyawan/EmployeeDrawer'
import {
  Users, UserCheck, UserMinus,
  Plus, Search, FileDown,
  LayoutGrid, List, SlidersHorizontal,
  ChevronDown
} from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { useDebounce } from '@/hooks/useDebounce'
import { formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export default function KaryawanPage() {
  const [drawerOpen, setDrawerOpen]       = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [search, setSearch]               = useState('')
  const [deptFilter, setDeptFilter]       = useState('')
  const [statusFilter, setStatusFilter]   = useState('')
  const [viewMode, setViewMode]           = useState<'list' | 'grid'>('list')
  const [showFilters, setShowFilters]     = useState(false)

  const debouncedSearch = useDebounce(search, 500)

  const queryParams = new URLSearchParams()
  if (debouncedSearch) queryParams.set('search', debouncedSearch)
  if (deptFilter)      queryParams.set('department_id', deptFilter)
  if (statusFilter)    queryParams.set('employment_status', statusFilter)
  queryParams.set('limit', '100')

  const { data: employees, meta, loading, refetch } = useApi<any[]>(`/api/employees?${queryParams}`)
  const { data: depts }     = useApi<any[]>('/api/departments')
  const { data: positions } = useApi<any[]>('/api/positions')

  const empList = employees || []
  const total   = meta?.total ?? empList.length
  const active  = empList.filter((e: any) => e.employment_status === 'active').length
  const inactive = empList.filter((e: any) => e.employment_status !== 'active').length

  const handleEdit = (emp: any) => { setSelectedEmployee(emp); setDrawerOpen(true) }
  const handleAdd  = ()         => { setSelectedEmployee(null); setDrawerOpen(true) }

  const handleDelete = async (emp: any) => {
    if (!confirm(`Hapus data ${emp.full_name}?`)) return
    try {
      const res  = await fetch(`/api/employees/${emp.id}`, { method: 'DELETE' })
      const json = await res.json()
      json.success ? refetch() : alert(json.error || 'Gagal menghapus')
    } catch { alert('Terjadi kesalahan sistem') }
  }

  const activeFilters = [deptFilter, statusFilter].filter(Boolean).length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Karyawan"
        description="Kelola data seluruh karyawan perusahaan"
      >
        <button className="btn-outline hidden sm:inline-flex">
          <FileDown className="w-3.5 h-3.5 mr-1.5" />
          Ekspor
        </button>
        <button onClick={handleAdd} className="btn-primary">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Tambah Karyawan
        </button>
      </PageHeader>

      {/* ── Stat row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Karyawan', value: total,    icon: Users,      color: 'text-foreground',       bg: 'bg-muted/60' },
          { label: 'Aktif',          value: active,   icon: UserCheck,  color: 'text-emerald-600',      bg: 'bg-emerald-50' },
          { label: 'Nonaktif / Resign', value: inactive, icon: UserMinus, color: 'text-red-500',         bg: 'bg-red-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-md flex items-center justify-center shrink-0', bg)}>
              <Icon className={cn('w-4.5 h-4.5', color)} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground truncate">{label}</div>
              <div className="text-[22px] font-semibold tracking-tight leading-none mt-0.5">{formatNumber(value)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="card-base">
        <div className="flex items-center gap-2 p-3 border-b border-border/60">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Cari nama atau kode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-muted/40 border border-transparent rounded-md text-[13px]
                         focus:outline-none focus:bg-white focus:border-primary/40 focus:ring-2 focus:ring-primary/10
                         placeholder:text-muted-foreground/50 transition-all"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-medium border transition-all',
              showFilters || activeFilters > 0
                ? 'bg-primary/8 border-primary/30 text-primary'
                : 'bg-white border-border text-muted-foreground hover:text-foreground hover:border-border/80',
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
            {activeFilters > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>

          {/* Status filter pills */}
          <div className="hidden md:flex items-center gap-1 ml-1">
            {['', 'active', 'inactive', 'resign'].map((s) => {
              const labels: Record<string, string> = { '': 'Semua', active: 'Aktif', inactive: 'Nonaktif', resign: 'Resign' }
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[12px] font-medium transition-all border',
                    statusFilter === s
                      ? 'bg-foreground text-white border-foreground'
                      : 'bg-white border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {labels[s]}
                </button>
              )
            })}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Record count */}
            <span className="text-[11.5px] text-muted-foreground hidden lg:block">
              {empList.length} karyawan
            </span>

            {/* View toggle */}
            <div className="flex bg-muted/40 p-0.5 rounded-md border border-border/60">
              <button
                onClick={() => setViewMode('list')}
                className={cn('p-1.5 rounded transition-all', viewMode === 'list' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn('p-1.5 rounded transition-all', viewMode === 'grid' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/20 border-b border-border/60">
            <span className="text-[11.5px] font-medium text-muted-foreground">Filter:</span>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-border rounded-md text-[12.5px] outline-none focus:border-primary/40 cursor-pointer"
            >
              <option value="">Semua Departemen</option>
              {depts?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-border rounded-md text-[12.5px] outline-none focus:border-primary/40 cursor-pointer md:hidden"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
              <option value="resign">Resign</option>
            </select>
            {activeFilters > 0 && (
              <button
                onClick={() => { setDeptFilter(''); setStatusFilter('') }}
                className="text-[12px] text-red-500 hover:underline ml-auto"
              >
                Reset filter
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <EmployeeTable
          data={(empList).map((emp: any) => ({
            id:            emp.id,
            full_name:     emp.full_name,
            employee_code: emp.employee_code,
            email:         emp.email,
            department:    emp.department?.name || '-',
            position:      emp.position?.name  || '-',
            status:        emp.employment_status,
            join_date:     emp.hire_date
              ? new Date(emp.hire_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              : '-',
          }))}
          loading={loading}
          viewMode={viewMode}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {drawerOpen && (
        <EmployeeDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSuccess={refetch}
          employee={selectedEmployee}
        />
      )}
    </div>
  )
}