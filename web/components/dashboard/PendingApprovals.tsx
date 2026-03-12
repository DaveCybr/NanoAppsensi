"use client"

import React from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Check, X, Eye } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const pendingData = [
  { id: 1, name: 'Hendra Wijaya', type: 'Cuti Tahunan', date: '12 - 14 Mar 2024', submitted: '10 Mar 2024' },
  { id: 2, name: 'Indah Permata', type: 'Koreksi Absensi', date: '08 Mar 2024', submitted: '09 Mar 2024' },
  { id: 3, name: 'Joni Iskandar', type: 'Sakit (Tanpa Surat)', date: '11 Mar 2024', submitted: '11 Mar 2024' },
  { id: 4, name: 'Kania Putri', type: 'Cuti Melahirkan', date: '20 Mar - 20 Jun 2024', submitted: '05 Mar 2024' },
]

export function PendingApprovals() {
  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
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
            {pendingData.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold">{item.name}</span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status="pending" className="font-semibold text-[10px]" />
                  <span className="ml-2 text-xs text-muted-foreground">{item.type}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-foreground font-medium">{item.date}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-muted-foreground">{item.submitted}</span>
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
          </tbody>
        </table>
      </div>
    </div>
  )
}
