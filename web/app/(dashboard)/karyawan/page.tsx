"use client"

import React, { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard } from '@/components/ui/StatsCard'
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
  List
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const mockEmployees = [
  { id: '1', full_name: 'Andi Saputra', employee_code: 'EMP001', department: 'IT & Eng', position: 'Senior Dev', status: 'active' as const, join_date: '12 Jan 2022' },
  { id: '2', full_name: 'Budi Hartanto', employee_code: 'EMP002', department: 'HRD', position: 'Manager', status: 'active' as const, join_date: '05 Feb 2021' },
  { id: '3', full_name: 'Citra Kirana', employee_code: 'EMP003', department: 'Marketing', position: 'Senior Staff', status: 'active' as const, join_date: '10 Mar 2023' },
  { id: '4', full_name: 'Dedi Mulyadi', employee_code: 'EMP004', department: 'Finance', position: 'Lead', status: 'inactive' as const, join_date: '15 Jul 2020' },
  { id: '5', full_name: 'Eka Putri', employee_code: 'EMP005', department: 'Operations', position: 'Support', status: 'active' as const, join_date: '20 Aug 2023' },
]

export default function KaryawanPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [search, setSearch] = useState('')

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee)
    setDrawerOpen(true)
  }

  const handleAdd = () => {
    setSelectedEmployee(null)
    setDrawerOpen(true)
  }

  const handleDelete = (employee: any) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data ${employee.full_name}?`)) {
      alert('Data akan dihapus.')
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
            <p className="text-xl font-bold">1,248</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Aktif</p>
            <p className="text-xl font-bold text-green-600">1,230</p>
          </div>
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Nonaktif / Resign</p>
            <p className="text-xl font-bold text-red-600">18</p>
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
          <select className="flex-1 md:w-40 px-3 py-2 bg-muted/30 border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-primary transition-all">
            <option value="">Semua Departemen</option>
            <option value="it">IT & Eng</option>
            <option value="hr">HRD</option>
          </select>
          <select className="flex-1 md:w-32 px-3 py-2 bg-muted/30 border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-primary transition-all">
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
          
          <div className="flex bg-muted p-1 rounded-lg shrink-0">
            <button className="p-1 px-2 bg-white rounded-md shadow-sm"><List className="w-4 h-4" /></button>
            <button className="p-1 px-2 transition-colors"><LayoutGrid className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="w-full">
        <EmployeeTable 
          data={mockEmployees} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <EmployeeDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        onSuccess={() => alert('Data berhasil diproses')}
        employee={selectedEmployee}
      />
    </div>
  )
}
