"use client"

import React from 'react'
import { 
  Eye, 
  MapPin, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AvatarInitials } from '@/components/ui/AvatarInitials'
import { cn } from '@/lib/utils/cn'
import { formatDate, formatTime } from '@/lib/utils/format'

interface AttendanceRecord {
  id: string
  attendance_date: string
  check_in: string | null
  check_out: string | null
  late_minutes: number
  check_in_is_valid_location: boolean
  status?: {
    code: string
    name: string
    color: string
  }
  employee?: {
    full_name: string
    employee_code: string
  }
}

interface AttendanceTableProps {
  data: AttendanceRecord[]
  onViewDetail: (record: AttendanceRecord) => void
}

export function AttendanceTable({ data, onViewDetail }: AttendanceTableProps) {
  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden text-left">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Karyawan</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Jam Masuk</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Jam Keluar</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Terlambat</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Lokasi</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-left">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <AvatarInitials name={item.employee?.full_name || '?'} size="sm" />
                    <div>
                      <p className="text-sm font-semibold">{item.employee?.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.employee?.employee_code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-foreground">{formatDate(item.attendance_date, 'short')}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className={cn("text-sm font-medium", item.status?.code === 'LATE' ? "text-amber-600" : "text-foreground")}>
                      {item.check_in ? formatTime(item.check_in) : '--:--'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-foreground">{item.check_out ? formatTime(item.check_out) : '--:--'}</span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={item.status?.code || 'ABSENT'} />
                </td>
                <td className="px-6 py-4">
                  {item.late_minutes > 0 ? (
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">{item.late_minutes}m</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs font-medium",
                    item.check_in_is_valid_location ? "text-green-600" : "text-red-600"
                  )}>
                    {item.check_in_is_valid_location ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" /> Valid</>
                    ) : (
                      <><XCircle className="w-3.5 h-3.5" /> Invalid</>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onViewDetail(item)}
                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-md transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
