"use client"

import React from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard } from '@/components/ui/StatsCard'
import { AttendanceChart } from '@/components/dashboard/AttendanceChart'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { PendingApprovals } from '@/components/dashboard/PendingApprovals'
import { 
  Users, 
  UserCheck, 
  CalendarCheck, 
  Clock,
  Download,
  Loader2
} from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { formatNumber } from '@/lib/utils/format'

export default function DashboardPage() {
  const { data: todayStats, loading: statsLoading } = useApi<any>('/api/attendance/today')
  const { data: leaveData } = useApi<any>('/api/leave/requests?status=pending&limit=1')
  
  const stats = [
    { 
      label: 'Karyawan Aktif', 
      value: formatNumber(todayStats?.total_employees || 0), 
      icon: Users, 
      color: 'blue' as const, 
      trend: { value: 0, isUp: true } 
    },
    { 
      label: 'Hadir Hari Ini', 
      value: formatNumber((todayStats?.total_present || 0) + (todayStats?.total_late || 0)), 
      icon: UserCheck, 
      color: 'green' as const, 
      trend: { value: 0, isUp: true, label: 'vs hari lalu' } 
    },
    { 
      label: 'Sedang Cuti', 
      value: formatNumber(todayStats?.on_leave_today || 0), 
      icon: CalendarCheck, 
      color: 'amber' as const, 
      trend: { value: 0, isUp: false } 
    },
    { 
      label: 'Permintaan Pending', 
      value: formatNumber(leaveData?.meta?.total_count || 0), 
      icon: Clock, 
      color: 'red' as const, 
      trend: { value: 0, isUp: true } 
    },
  ]

  return (
    <div className="space-y-8 relative text-left">
      {statsLoading && (
        <div className="absolute inset-x-0 -top-2 h-1 overflow-hidden">
          <div className="w-full h-full bg-primary/10 animate-pulse" />
        </div>
      )}
      
      <PageHeader title="Dashboard Analitik">
        <button className="btn-outline">
          <Download className="w-4 h-4 mr-2" />
          Ekspor Laporan
        </button>
        <button className="btn-primary">
          Check-in Massal
        </button>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatsCard key={i} {...stat} />
        ))}
      </div>

      {/* Main Grid: Chart + Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <AttendanceChart />
        </div>
        <div className="xl:col-span-1">
          <ActivityFeed />
        </div>
      </div>

      {/* Pending Approvals Table */}
      <div className="w-full">
        <PendingApprovals />
      </div>

      {/* Real-time Summary Footer */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-sm font-medium">
            Sistem Berjalan Normal • <span className="text-muted-foreground">Update terakhir: {new Date().toLocaleTimeString()} WIB</span>
          </p>
        </div>
        <div className="text-xs font-semibold text-primary uppercase tracking-widest text-left">
          NanoApp Real-time Engine Active
        </div>
      </div>
    </div>
  )
}
