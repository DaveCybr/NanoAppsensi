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
  Download
} from 'lucide-react'

export default function DashboardPage() {
  const stats = [
    { label: 'Karyawan Aktif', value: '1,248', icon: Users, color: 'blue' as const, trend: { value: 12, isUp: true } },
    { label: 'Hadir Hari Ini', value: '1,192', icon: UserCheck, color: 'green' as const, trend: { value: 8, isUp: true, label: 'vs hari lalu' } },
    { label: 'Cuti Disetujui', value: '24', icon: CalendarCheck, color: 'amber' as const, trend: { value: 5, isUp: false } },
    { label: 'Permintaan Pending', value: '12', icon: Clock, color: 'red' as const, trend: { value: 3, isUp: true } },
  ]

  return (
    <div className="space-y-8">
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
            Sistem Berjalan Normal • <span className="text-muted-foreground">Update terakhir: Hari ini, 10:45 WIB</span>
          </p>
        </div>
        <div className="text-xs font-semibold text-primary uppercase tracking-widest">
          NanoApp Real-time Engine Active
        </div>
      </div>
    </div>
  )
}
