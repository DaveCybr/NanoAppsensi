import React from 'react'
import { cn } from '@/lib/utils/cn'

export type StatusType = 
  | 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' 
  | 'LATE' | 'PRESENT' | 'ABSENT' | 'WFH' | 'LEAVE'

const statusConfig: Record<StatusType, { label: string, class: string }> = {
  active:    { label: 'Aktif',       class: 'bg-green-100 text-green-800' },
  inactive:  { label: 'Tidak Aktif', class: 'bg-gray-100 text-gray-600' },
  pending:   { label: 'Pending',     class: 'bg-amber-100 text-amber-800' },
  approved:  { label: 'Disetujui',   class: 'bg-green-100 text-green-800' },
  rejected:  { label: 'Ditolak',     class: 'bg-red-100 text-red-800' },
  LATE:      { label: 'Terlambat',   class: 'bg-amber-100 text-amber-800' },
  PRESENT:   { label: 'Hadir',       class: 'bg-green-100 text-green-800' },
  ABSENT:    { label: 'Tidak Hadir', class: 'bg-red-100 text-red-800' },
  WFH:       { label: 'WFH',         class: 'bg-blue-100 text-blue-800' },
  LEAVE:     { label: 'Cuti',        class: 'bg-purple-100 text-purple-800' },
}

interface StatusBadgeProps {
  status: string | StatusType
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || { label: status, class: 'bg-gray-100 text-gray-800' }
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      config.class,
      className
    )}>
      {config.label}
    </span>
  )
}
