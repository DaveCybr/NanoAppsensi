"use client"

import React, { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { AttendanceTable } from '@/components/absensi/AttendanceTable'
import { AttendanceDetail } from '@/components/absensi/AttendanceDetail'
import { CorrectionReview } from '@/components/absensi/CorrectionReview'
import { 
  Download,
  Filter,
  Search,
  Calendar,
  Loader2
} from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { useDebounce } from '@/hooks/useDebounce'
import { formatNumber } from '@/lib/utils/format'

export default function AbsensiPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Fetch Summary
  const { data: todaySummary } = useApi<any>('/api/attendance/today')
  
  // Fetch Attendance Logs
  const { data: attendanceData, loading: logsLoading } = useApi<any>(
    `/api/attendance?month=${selectedMonth}`
  )
  const rawAttendances = attendanceData?.data || []

  // Filter search locally since API doesn't support employee_name param
  const attendances = rawAttendances.filter((a: any) =>
    a.employee?.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const handleViewDetail = (record: any) => {
    setSelectedRecord(record)
    setIsDetailOpen(true)
  }

  return (
    <div className="space-y-8 relative text-left">
      <PageHeader title="Rekapitulasi Absensi">
        <button className="btn-outline">
          <Download className="w-4 h-4 mr-2" />
          Ekspor Log
        </button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Hadir Hari Ini</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-extrabold text-green-600">
              {formatNumber((todaySummary?.total_present || 0) + (todaySummary?.total_late || 0))}
            </h3>
            <div className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
              {todaySummary?.total_employees ? Math.round(((todaySummary.total_present + todaySummary.total_late) / todaySummary.total_employees) * 100) : 0}%
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Terlambat</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-extrabold text-amber-600">{formatNumber(todaySummary?.total_late || 0)}</h3>
            <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
              {todaySummary?.total_employees ? Math.round((todaySummary.total_late / todaySummary.total_employees) * 100) : 0}%
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tidak Hadir</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-extrabold text-red-600">{formatNumber(todaySummary?.total_absent || 0)}</h3>
            <div className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
              {todaySummary?.total_employees ? Math.round((todaySummary.total_absent / todaySummary.total_employees) * 100) : 0}%
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-2 text-left">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">WFH</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-extrabold text-primary">{formatNumber(todaySummary?.total_wfh || 0)}</h3>
            <div className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded">Orang</div>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted/30 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg text-sm transition-all outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-muted/30 border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-primary transition-all cursor-pointer"
                />
              </div>
              <button className="p-2 bg-muted rounded-lg text-muted-foreground hover:bg-muted/80">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="relative">
            {logsLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            <AttendanceTable data={attendances} onViewDetail={handleViewDetail} />
            {attendances.length === 0 && !logsLoading && (
              <div className="p-12 text-center text-sm text-muted-foreground bg-card rounded-lg border">
                Tidak ada data absensi untuk periode ini
              </div>
            )}
          </div>
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
