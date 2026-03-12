"use client"

import React from 'react'
import { 
  Check, 
  X, 
  Eye, 
  Calendar,
  User,
  AlertCircle,
  FileText
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AvatarInitials } from '@/components/ui/AvatarInitials'
import { cn } from '@/lib/utils/cn'

interface LeaveRecord {
  id: string
  employee_name: string
  leave_type: string
  start_date: string
  end_date: string
  days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
}

interface LeaveTableProps {
  data: LeaveRecord[]
  onApprove: (record: LeaveRecord) => void
  onReject: (record: LeaveRecord) => void
  onView: (record: LeaveRecord) => void
}

export function LeaveTable({ data, onApprove, onReject, onView }: LeaveTableProps) {
  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden text-left">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Karyawan</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Jenis Cuti</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Periode</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Durasi</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Alasan</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-left">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <AvatarInitials name={item.employee_name} size="sm" />
                    <div>
                      <p className="text-sm font-semibold">{item.employee_name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tighter">Diajukan: {item.submitted_at}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10">
                    {item.leave_type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{item.start_date} - {item.end_date}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-left">
                  <span className="text-sm font-bold">{item.days} Hari</span>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <p className="text-xs text-muted-foreground truncate" title={item.reason}>{item.reason}</p>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={item.status} className="font-bold text-[10px]" />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {item.status === 'pending' ? (
                      <>
                        <button 
                          onClick={() => onApprove(item)}
                          className="p-1.5 hover:bg-green-100 text-green-600 rounded-md transition-all shadow-sm active:scale-95" 
                          title="Setujui"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onReject(item)}
                          className="p-1.5 hover:bg-red-100 text-red-600 rounded-md transition-all shadow-sm active:scale-95" 
                          title="Tolak"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => onView(item)}
                        className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-md transition-colors" 
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
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
