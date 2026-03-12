import React from 'react'
import { cn } from '@/lib/utils/cn'

export type StatusType =
  | 'active' | 'inactive' | 'pending' | 'approved' | 'rejected'
  | 'LATE' | 'PRESENT' | 'ABSENT' | 'WFH' | 'LEAVE'

const statusConfig: Record<StatusType, { label: string; cls: string }> = {
  active:   { label: 'Aktif',       cls: 'badge badge-green' },
  inactive: { label: 'Tidak Aktif', cls: 'badge badge-gray' },
  pending:  { label: 'Pending',     cls: 'badge badge-amber' },
  approved: { label: 'Disetujui',   cls: 'badge badge-green' },
  rejected: { label: 'Ditolak',     cls: 'badge badge-red' },
  LATE:     { label: 'Terlambat',   cls: 'badge badge-amber' },
  PRESENT:  { label: 'Hadir',       cls: 'badge badge-green' },
  ABSENT:   { label: 'Tidak Hadir', cls: 'badge badge-red' },
  WFH:      { label: 'WFH',         cls: 'badge badge-blue' },
  LEAVE:    { label: 'Cuti',        cls: 'badge badge-purple' },
}

interface StatusBadgeProps {
  status: string | StatusType
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = statusConfig[status as StatusType] ?? { label: status, cls: 'badge badge-gray' }

  return (
    <span className={cn(cfg.cls, className)}>
      {cfg.label}
    </span>
  )
}