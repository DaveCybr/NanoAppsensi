"use client"

import React from 'react'
import { AvatarInitials } from '@/components/ui/AvatarInitials'
import { useApi } from '@/hooks/useApi'
import { formatRelative, formatTime } from '@/lib/utils/format'
import { Loader2 } from 'lucide-react'

export function ActivityFeed() {
  const { data: attendanceData, loading } = useApi<any>('/api/attendance?limit=10&sort_dir=desc')
  const activities = attendanceData?.data || []

  return (
    <div className="bg-card p-6 rounded-lg border shadow-sm h-full flex flex-col relative text-left">
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold leading-none">Aktivitas Terbaru</h3>
          <p className="text-sm text-muted-foreground mt-1">Log absensi hari ini</p>
        </div>
        <button className="text-xs font-semibold text-primary hover:underline">Lihat Semua</button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-hide">
        {activities.map((item: any) => (
          <div key={item.id} className="flex gap-4 group">
            <AvatarInitials name={item.employee?.full_name || '?'} size="sm" className="ring-2 ring-background group-hover:ring-primary/20 transition-all" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p className="text-sm font-semibold truncate">{item.employee?.full_name}</p>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatRelative(item.check_in || item.attendance_date)}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed truncate">
                {item.check_in ? `Check-in: ${formatTime(item.check_in)}` : 'Belum check-in'} 
                {item.status?.name ? ` • ${item.status.name}` : ''}
              </p>
            </div>
          </div>
        ))}
        {activities.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">Tidak ada aktivitas hari ini</p>
          </div>
        )}
      </div>
    </div>
  )
}
