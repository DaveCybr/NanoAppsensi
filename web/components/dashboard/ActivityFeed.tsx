"use client"

import React from 'react'
import { AvatarInitials } from '@/components/ui/AvatarInitials'
import { cn } from '@/lib/utils/cn'

const activities = [
  { id: 1, type: 'checkin', name: 'Andi Saputra', time: '10 menit yang lalu', extra: 'Check-in: 08:02 WIB' },
  { id: 2, type: 'leave', name: 'Budi Hartanto', time: '1 jam yang lalu', extra: 'Mengajukan Cuti Tahunan' },
  { id: 3, type: 'checkin', name: 'Citra Kirana', time: '2 jam yang lalu', extra: 'Check-in: 08:15 WIB (Terlambat)' },
  { id: 4, type: 'checkout', name: 'Dedi Mulyadi', time: '3 jam yang lalu', extra: 'Check-out: 17:05 WIB' },
  { id: 5, type: 'correction', name: 'Eka Putri', time: '5 jam yang lalu', extra: 'Mengajukan Koreksi Absensi' },
  { id: 6, type: 'checkin', name: 'Fahmi Idris', time: '6 jam yang lalu', extra: 'Check-in: 07:55 WIB' },
]

export function ActivityFeed() {
  return (
    <div className="bg-card p-6 rounded-lg border shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold leading-none">Aktivitas Terbaru</h3>
          <p className="text-sm text-muted-foreground mt-1">Update log sistem hari ini</p>
        </div>
        <button className="text-xs font-semibold text-primary hover:underline">Lihat Semua</button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-hide">
        {activities.map((item) => (
          <div key={item.id} className="flex gap-4 group">
            <AvatarInitials name={item.name} size="sm" className="ring-2 ring-background group-hover:ring-primary/20 transition-all" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p className="text-sm font-semibold truncate">{item.name}</p>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{item.time}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed truncate">{item.extra}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
