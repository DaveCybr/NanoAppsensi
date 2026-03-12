"use client"

import React from 'react'
import { Calendar as LucideCalendar, ChevronLeft, ChevronRight, Plus, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const holidays = [
  { date: '11 Mar', name: 'Hari Raya Nyepi', type: 'Nasional' },
  { date: '29 Mar', name: 'Wafat Yesus Kristus', type: 'Nasional' },
  { date: '10 Apr', name: 'Idul Fitri 1445 H', type: 'Agama' },
  { date: '11 Apr', name: 'Cuti Bersama Lebaran', type: 'Bersama' },
]

export function HolidayCalendar() {
  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden text-left">
      <div className="p-6 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <LucideCalendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Hari Libur & Cuti Bersama</h3>
            <p className="text-xs text-muted-foreground mt-1">Kalender resmi tahun 2024</p>
          </div>
        </div>
        <button className="btn-outline text-xs px-4">Tambah Libur</button>
      </div>

      <div className="p-6 space-y-4 text-left">
        {/* Simple Month View Placeholder */}
        <div className="bg-muted/30 rounded-xl p-4 flex items-center justify-between mb-2">
          <button className="p-1 hover:bg-white rounded-md transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-bold uppercase tracking-widest">Maret 2024</span>
          <button className="p-1 hover:bg-white rounded-md transition-colors"><ChevronRight className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3 text-left">
          {holidays.map((h, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white border rounded-xl hover:border-red-200 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex flex-col items-center justify-center border border-red-100 flex-shrink-0">
                  <span className="text-[10px] font-bold uppercase leading-none">{h.date.split(' ')[1]}</span>
                  <span className="text-lg font-black leading-none mt-1">{h.date.split(' ')[0]}</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold group-hover:text-red-600 transition-colors">{h.name}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Libur {h.type}</p>
                </div>
              </div>
              <button className="p-2 text-muted-foreground hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-muted/10 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span>Sync otomatis dengan Kalender SKB 3 Menteri</span>
        </div>
      </div>
    </div>
  )
}
