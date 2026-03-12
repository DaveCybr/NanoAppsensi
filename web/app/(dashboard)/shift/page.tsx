"use client"

import React from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ShiftTable } from '@/components/shift/ShiftTable'
import { HolidayCalendar } from '@/components/shift/HolidayCalendar'
import { 
  Repeat, 
  Calendar, 
  Download,
  Users,
  Clock,
  Settings2
} from 'lucide-react'

export default function ShiftPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Shift & Hari Libur">
        <button className="btn-outline">
          <Settings2 className="w-4 h-4 mr-2" />
          Atur Kebijakan
        </button>
        <button className="btn-primary">
          Check-in Massal
        </button>
      </PageHeader>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-sidebar p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] -mr-16 -mt-16" />
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Shift Aktif Hari Ini</p>
          <div className="flex items-end justify-between relative z-10">
            <h3 className="text-3xl font-black">4 <span className="text-xs font-normal text-white/60">Shift</span></h3>
            <Repeat className="w-10 h-10 text-primary opacity-50" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between text-left">
          <div className="text-left">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Karyawan Ber-Shift</p>
            <h3 className="text-3xl font-black">1.1k <span className="text-xs font-normal text-muted-foreground uppercase">Tersinkron</span></h3>
          </div>
          <Users className="w-10 h-10 text-blue-100" />
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between text-left">
          <div className="text-left">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Libur Terdekat</p>
            <h3 className="text-3xl font-black">29 <span className="text-xs font-normal text-red-600 uppercase">Mar</span></h3>
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
