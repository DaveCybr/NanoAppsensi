"use client"

import React, { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard } from '@/components/ui/StatsCard'
import { AttendanceTable } from '@/components/absensi/AttendanceTable'
import { AttendanceDetail } from '@/components/absensi/AttendanceDetail'
import { CorrectionReview } from '@/components/absensi/CorrectionReview'
import { 
  History, 
  CheckCircle2, 
  Clock, 
  XSquare, 
  Download,
  Filter,
  Search,
  Calendar
} from 'lucide-react'

const mockAttendance = [
  { id: '1', employee_name: 'Andi Saputra', date: '15 Mar 2024', check_in: '08:02', check_out: '17:05', status: 'PRESENT' as const, late_minutes: 0, is_valid_location: true },
  { id: '2', employee_name: 'Budi Hartanto', date: '15 Mar 2024', check_in: '08:45', check_out: '17:30', status: 'LATE' as const, late_minutes: 45, is_valid_location: true },
  { id: '3', employee_name: 'Citra Kirana', date: '15 Mar 2024', check_in: '07:55', check_out: null, status: 'PRESENT' as const, late_minutes: 0, is_valid_location: false },
  { id: '4', employee_name: 'Dedi Mulyadi', date: '15 Mar 2024', check_in: null, check_out: null, status: 'ABSENT' as const, late_minutes: 0, is_valid_location: false },
  { id: '5', employee_name: 'Eka Putri', date: '14 Mar 2024', check_in: '13:00', check_out: '22:00', status: 'WFH' as const, late_minutes: 0, is_valid_location: true },
]

export default function AbsensiPage() {
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleViewDetail = (record: any) => {
    setSelectedRecord(record)
    setIsDetailOpen(true)
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Rekapitulasi Absensi">
        <button className="btn-outline">
          <Download className="w-4 h-4 mr-2" />
          Ekspor Log
        </button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Hadir</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-extrabold text-green-600">1,192</h3>
            <div className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">95.5%</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Terlambat</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-extrabold text-amber-600">42</h3>
            <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">3.4%</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tidak Hadir</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-extrabold text-red-600">14</h3>
            <div className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded">1.1%</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-2 text-left">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Jam Kerja</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-extrabold text-primary">8,450j</h3>
            <div className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded">Bulan ini</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1">
          <CorrectionReview />
        </div>

        <div className="xl:col-span-2 space-y-6">
          {/* Filters */}
          <div className="bg-card p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Cari karyawan..." 
                className="w-full pl-10 pr-4 py-2 bg-muted/30 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg text-sm transition-all outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select className="pl-10 pr-8 py-2 bg-muted/30 border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-primary transition-all appearance-none cursor-pointer">
                  <option>Maret 2024</option>
                  <option>Februari 2024</option>
                </select>
              </div>
              <button className="p-2 bg-muted rounded-lg text-muted-foreground hover:bg-muted/80">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Table */}
          <AttendanceTable data={mockAttendance} onViewDetail={handleViewDetail} />
        </div>
      </div>

      <AttendanceDetail 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        record={selectedRecord} 
      />
    </div>
  )
}
