import React from 'react'
import { cn } from '@/lib/utils/cn'
import { LucideIcon } from 'lucide-react'

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
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600' },
  amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
  cyan:   { bg: 'bg-cyan-50',   icon: 'text-cyan-600' },
}

export function StatsCard({ 
  label, 
  value, 
  icon: Icon, 
  color = 'blue', 
  trend,
  className 
}: StatsCardProps) {
  const colors = colorConfig[color]

  return (
    <div className={cn("bg-card p-6 rounded-lg border shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          
          {trend && (
            <div className="flex items-center mt-2 space-x-1">
              <span className={cn(
                "text-xs font-semibold",
                trend.isUp ? "text-green-600" : "text-red-600"
              )}>
                {trend.isUp ? "+" : ""}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label || 'vs bln lalu'}</span>
            </div>
          )}
        </div>
        
        <div className={cn("p-3 rounded-lg", colors.bg)}>
          <Icon className={cn("w-5 h-5", colors.icon)} />
        </div>
      </div>
    </div>
  )
}
