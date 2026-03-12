"use client"

import React, { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { LeaveTable } from '@/components/cuti/LeaveTable'
import { LeaveDrawer } from '@/components/cuti/LeaveDrawer'
import { 
  Plus, 
  Calendar, 
  Search, 
  FileText,
  Filter,
  CheckCircle2,
  Clock,
  BarChart2
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const mockLeaves = [
  { id: '1', employee_name: 'Hendra Wijaya', leave_type: 'Cuti Tahunan', start_date: '12 Mar 2024', end_date: '14 Mar 2024', days: 3, reason: 'Acara pernikahan adik kandung', status: 'pending' as const, submitted_at: '10 Mar 2024' },
  { id: '2', employee_name: 'Indah Permata', leave_type: 'Cuti Tahunan', start_date: '18 Mar 2024', end_date: '20 Mar 2024', days: 3, reason: 'Urusan keluarga luar kota', status: 'approved' as const, submitted_at: '10 Mar 2024' },
  { id: '3', employee_name: 'Joni Iskandar', leave_type: 'Sakit', start_date: '11 Mar 2024', end_date: '11 Mar 2024', days: 1, reason: 'Demam tinggi dan flu', status: 'rejected' as const, submitted_at: '11 Mar 2024' },
  { id: '4', employee_name: 'Kania Putri', leave_type: 'Melahirkan', start_date: '20 Mar 2024', end_date: '20 Jun 2024', days: 90, reason: 'Izin melahirkan anak pertama', status: 'pending' as const, submitted_at: '05 Mar 2024' },
]

export default function CutiPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="space-y-8">
      <PageHeader title="Manajemen Cuti">
        <button onClick={() => setDrawerOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Ajukan Cuti
        </button>
      </PageHeader>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Menunggu Persetujuan</p>
            <p className="text-2xl font-extrabold">12 Permohonan</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Disetujui (Bulan Ini)</p>
            <p className="text-2xl font-extrabold">45 Karyawan</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tingkat Absensi Cuti</p>
            <p className="text-2xl font-extrabold">3.2% <span className="text-xs text-green-600 font-bold ml-1">↓ 0.5%</span></p>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-card p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Cari nama karyawan..." 
            className="w-full pl-10 pr-4 py-2 bg-muted/30 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg text-sm transition-all outline-none"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select className="flex-1 md:w-40 px-3 py-2 bg-muted/30 border-transparent rounded-lg text-sm outline-none focus:bg-white transition-all appearance-none cursor-pointer">
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Disetujui</option>
          </select>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select className="pl-10 pr-8 py-2 bg-muted/30 border-transparent rounded-lg text-sm outline-none focus:bg-white appearance-none cursor-pointer font-medium">
              <option>Maret 2024</option>
              <option>Filter Tahun</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="w-full">
        <LeaveTable 
          data={mockLeaves}
          onApprove={() => alert('Cuti disetujui')}
          onReject={() => alert('Cuti ditolak')}
          onView={() => alert('Membuka detail')}
        />
      </div>

      <LeaveDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        onSuccess={() => alert('Pengajuan berhasil dikirim')} 
      />
    </div>
  )
}
