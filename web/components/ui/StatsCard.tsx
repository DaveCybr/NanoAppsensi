import React from 'react'
import { cn } from '@/lib/utils/cn'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan'
  trend?: {
    value: number | string
    label?: string
    isUp?: boolean
  }
  className?: string
}

const colorConfig = {
  blue:   { iconBg: 'bg-blue-50',   iconText: 'text-blue-600',   dot: 'bg-blue-500' },
  green:  { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', dot: 'bg-emerald-500' },
  amber:  { iconBg: 'bg-amber-50',  iconText: 'text-amber-600',  dot: 'bg-amber-500' },
  red:    { iconBg: 'bg-red-50',    iconText: 'text-red-600',    dot: 'bg-red-500' },
  purple: { iconBg: 'bg-purple-50', iconText: 'text-purple-600', dot: 'bg-purple-500' },
  cyan:   { iconBg: 'bg-cyan-50',   iconText: 'text-cyan-600',   dot: 'bg-cyan-500' },
}

export function StatsCard({ label, value, icon: Icon, color = 'blue', trend, className }: StatsCardProps) {
  const c = colorConfig[color]

  return (
    <div className={cn(
      'stat-card flex flex-col gap-3',
      className,
    )}>
      <div className="flex items-start justify-between">
        <p className="text-[11.5px] font-medium text-muted-foreground leading-none">{label}</p>
        <div className={cn('w-8 h-8 rounded-md flex items-center justify-center shrink-0', c.iconBg)}>
          <Icon className={cn('w-4 h-4', c.iconText)} strokeWidth={2} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className="text-[28px] font-semibold tracking-tight text-foreground leading-none">
          {value}
        </span>

        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-[11px] font-medium mb-0.5',
            trend.isUp ? 'text-emerald-600' : 'text-red-500',
          )}>
            {trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trend.isUp ? '+' : ''}{trend.value}%</span>
            {trend.label && <span className="text-muted-foreground font-normal">{trend.label}</span>}
          </div>
        )}
      </div>
    </div>
  )
}