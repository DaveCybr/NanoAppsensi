"use client"

import React from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ShiftTable } from '@/components/shift/ShiftTable'
import { HolidayCalendar } from '@/components/shift/HolidayCalendar'
import { 
  Repeat, 
  Calendar, 
  Users,
  Settings2,
  Loader2
} from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { formatNumber } from '@/lib/utils/format'

export default function ShiftPage() {
  const currentYear = new Date().getFullYear()
  const { data: shifts, loading: shiftsLoading } = useApi<any[]>('/api/shifts')
  const { data: holidays, loading: holidaysLoading } = useApi<any[]>(`/api/holidays?year=${currentYear}`)

  const totalShifts = shifts?.length ?? 0

  // Find next upcoming holiday
  const today = new Date().toISOString().slice(0, 10)
  const nextHoliday = holidays
    ?.filter((h: any) => h.date >= today)
    ?.sort((a: any, b: any) => a.date.localeCompare(b.date))?.[0]

  const nextHolidayDate = nextHoliday
    ? new Date(nextHoliday.date)
    : null

  return (
    <div className="space-y-8">
      <PageHeader title="Shift & Hari Libur">
        <button className="btn-outline">
          <Settings2 className="w-4 h-4 mr-2" />
          Atur Kebijakan
        </button>
      </PageHeader>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-sidebar p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] -mr-16 -mt-16" />
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Shift Aktif</p>
          <div className="flex items-end justify-between relative z-10">
            <h3 className="text-3xl font-black">
              {shiftsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatNumber(totalShifts)} <span className="text-xs font-normal text-white/60">Shift</span>
            </h3>
            <Repeat className="w-10 h-10 text-primary opacity-50" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between text-left">
          <div className="text-left">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Hari Libur</p>
            <h3 className="text-3xl font-black">
              {holidaysLoading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : formatNumber(holidays?.length ?? 0)} <span className="text-xs font-normal text-muted-foreground uppercase">Tahun {currentYear}</span>
            </h3>
          </div>
          <Users className="w-10 h-10 text-blue-100" />
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between text-left">
          <div className="text-left">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Libur Terdekat</p>
            <h3 className="text-3xl font-black">
              {nextHolidayDate ? (
                <>{nextHolidayDate.getDate()} <span className="text-xs font-normal text-red-600 uppercase">{nextHolidayDate.toLocaleDateString('id-ID', { month: 'short' })}</span></>
              ) : (
                <span className="text-sm font-normal text-muted-foreground">Tidak ada</span>
              )}
            </h3>
            {nextHoliday && (
              <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-[160px]">{nextHoliday.name}</p>
            )}
          </div>
          <Calendar className="w-10 h-10 text-red-100" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ShiftTable />
        <HolidayCalendar />
      </div>

      {/* Shift Assignment Placeholder/Footer */}
      <div className="bg-card p-8 rounded-2xl border border-dashed text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="max-w-md mx-auto">
          <h4 className="font-bold text-lg">Manajemen Jadwal Karyawan</h4>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            Gunakan fitur Alokasi Shift untuk mengatur jadwal mingguan atau bulanan secara massal untuk departemen tertentu.
          </p>
        </div>
        <button className="btn-outline font-bold">Buka Alokasi Shift</button>
      </div>
    </div>
  )
}
