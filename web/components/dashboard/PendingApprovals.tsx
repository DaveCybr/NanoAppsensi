"use client"

import React from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Check, X, Eye, Loader2 } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { formatDate } from '@/lib/utils/format'

export function PendingApprovals() {
  const { data: leaveData, loading } = useApi<any>('/api/leave/requests?status=pending&limit=5')
  const pendingData = leaveData?.data || []

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden relative text-left">
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold leading-none">Persetujuan Pending</h3>
          <p className="text-sm text-muted-foreground mt-1">Permintaan yang perlu tindakan HR</p>
        </div>
        <button className="text-xs font-semibold text-primary hover:underline">Kelola Semua Permintaan</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Karyawan</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Jenis</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Periode</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Diajukan</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pendingData.map((item: any) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold">{item.employee?.full_name}</span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status="pending" className="font-semibold text-[10px]" />
                  <span className="ml-2 text-xs text-muted-foreground">{item.leave_type?.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-foreground font-medium">
                    {formatDate(item.start_date, 'short')} - {formatDate(item.end_date, 'short')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-muted-foreground">{formatDate(item.created_at, 'short')}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-green-100 text-green-600 rounded-md transition-colors" title="Setujui">
                      <Check className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-red-100 text-red-600 rounded-md transition-colors" title="Tolak">
                      <X className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-md transition-colors" title="Lihat Detail">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pendingData.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Tidak ada permohonan pending
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
