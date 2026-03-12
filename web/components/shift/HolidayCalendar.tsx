"use client"

import React, { useState, useMemo } from 'react'
import { Calendar as LucideCalendar, ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { formatDate } from '@/lib/utils/format'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export function HolidayCalendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed

  const { data: holidays, loading } = useApi<any[]>(`/api/holidays?year=${year}`)

  const filteredHolidays = useMemo(() => {
    if (!holidays) return []
    return holidays.filter((h: any) => {
      const d = new Date(h.date)
      return d.getMonth() === month && d.getFullYear() === year
    })
  }, [holidays, month, year])

  const handlePrev = () => {
    if (month === 0) {
      setMonth(11)
      setYear(y => y - 1)
    } else {
      setMonth(m => m - 1)
    }
  }

  const handleNext = () => {
    if (month === 11) {
      setMonth(0)
      setYear(y => y + 1)
    } else {
      setMonth(m => m + 1)
    }
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden text-left">
      <div className="p-6 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <LucideCalendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Hari Libur & Cuti Bersama</h3>
            <p className="text-xs text-muted-foreground mt-1">Kalender resmi tahun {year}</p>
          </div>
        </div>
        <button className="btn-outline text-xs px-4">Tambah Libur</button>
      </div>

      <div className="p-6 space-y-4 text-left relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Month Navigation */}
        <div className="bg-muted/30 rounded-xl p-4 flex items-center justify-between mb-2">
          <button onClick={handlePrev} className="p-1 hover:bg-white rounded-md transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-bold uppercase tracking-widest">{MONTH_NAMES[month]} {year}</span>
          <button onClick={handleNext} className="p-1 hover:bg-white rounded-md transition-colors"><ChevronRight className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3 text-left">
          {filteredHolidays.map((h: any) => {
            const d = new Date(h.date)
            const dayNum = d.getDate().toString()
            const monthShort = d.toLocaleDateString('id-ID', { month: 'short' })
            return (
              <div key={h.id} className="flex items-center justify-between p-3 bg-white border rounded-xl hover:border-red-200 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex flex-col items-center justify-center border border-red-100 flex-shrink-0">
                    <span className="text-[10px] font-bold uppercase leading-none">{monthShort}</span>
                    <span className="text-lg font-black leading-none mt-1">{dayNum}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold group-hover:text-red-600 transition-colors">{h.name}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      Libur {h.type === 'national' ? 'Nasional' : h.type === 'company' ? 'Perusahaan' : h.type}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}

          {!loading && filteredHolidays.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Tidak ada hari libur di bulan ini
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-muted/10 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span>Total {holidays?.length ?? 0} hari libur di tahun {year}</span>
        </div>
      </div>
    </div>
  )
}
