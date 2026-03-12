"use client"

import React, { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmployeeTable } from '@/components/karyawan/EmployeeTable'
import { EmployeeDrawer } from '@/components/karyawan/EmployeeDrawer'
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  Plus, 
  Search, 
  FileDown,
  LayoutGrid,
  List,
  Loader2
} from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { useDebounce } from '@/hooks/useDebounce'
import { formatNumber } from '@/lib/utils/format'

export default function KaryawanPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const debouncedSearch = useDebounce(search, 500)

  // Construct query params
  const queryParams = new URLSearchParams()
  if (debouncedSearch) queryParams.set('search', debouncedSearch)
  if (deptFilter) queryParams.set('department_id', deptFilter)
  if (statusFilter) queryParams.set('employment_status', statusFilter)
  queryParams.set('limit', '100') // Fetch more for now

  // API Hooks
  const { data: employeesData, loading, refetch } = useApi<any>(`/api/employees?${queryParams.toString()}`)
  const { data: depts } = useApi<any[]>('/api/departments')
  const { data: positions } = useApi<any[]>('/api/positions')

  const employees = employeesData?.data || []
  
  // Calculate stats from data (or you could have a separate summary API)
  const stats = {
    total: employees.length,
    active: employees.filter((e: any) => e.employment_status === 'active').length,
    inactive: employees.filter((e: any) => e.employment_status !== 'active').length,
  }

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee)
    setDrawerOpen(true)
  }

  const handleAdd = () => {
    setSelectedEmployee(null)
    setDrawerOpen(true)
  }

  const handleDelete = async (employee: any) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data ${employee.full_name}?`)) {
      try {
        const res = await fetch(`/api/employees/${employee.id}`, { method: 'DELETE' })
        const json = await res.json()
        if (json.success) {
          refetch()
        } else {
          alert(json.error || 'Gagal menghapus data')
        }
      } catch (err) {
        alert('Terjadi kesalahan sistem')
      }
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Manajemen Karyawan">
        <button className="btn-outline hidden sm:inline-flex">
          <FileDown className="w-4 h-4 mr-2" />
          Ekspor Karyawan
        </button>
        <button onClick={handleAdd} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Karyawan
        </button>
      </PageHeader>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Karyawan</p>
            <p className="text-xl font-bold">{formatNumber(stats.total)}</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Aktif</p>
            <p className="text-xl font-bold text-green-600">{formatNumber(stats.active)}</p>
          </div>
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Nonaktif / Resign</p>
            <p className="text-xl font-bold text-red-600">{formatNumber(stats.inactive)}</p>
          </div>
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
            <UserMinus className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Cari nama atau kode karyawan..." 
            className="w-full pl-10 pr-4 py-2 bg-muted/30 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg text-sm transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="flex-1 md:w-48 px-3 py-2 bg-muted/30 border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-primary transition-all"
          >
            <option value="">Semua Departemen</option>
            {depts?.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:w-32 px-3 py-2 bg-muted/30 border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-primary transition-all"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
            <option value="resign">Resign</option>
          </select>
          
          <div className="flex bg-muted p-1 rounded-lg shrink-0">
            <button className="p-1 px-2 bg-white rounded-md shadow-sm"><List className="w-4 h-4" /></button>
            <button className="p-1 px-2 transition-colors"><LayoutGrid className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="w-full relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        <EmployeeTable 
          data={employees.map((emp: any) => ({
            id: emp.id,
            full_name: emp.full_name,
            employee_code: emp.employee_code,
            department: emp.department?.name || '-',
            position: emp.position?.name || '-',
            status: emp.employment_status,
            join_date: emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'
          }))} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {drawerOpen && (
        <EmployeeDrawer 
          isOpen={drawerOpen} 
          onClose={() => setDrawerOpen(false)} 
          onSuccess={() => {
            refetch()
          }}
          employee={selectedEmployee}
        />
      )}
    </div>
  )
}
