import React from 'react'
import { cn } from '@/lib/utils/cn'

interface AvatarInitialsProps {
  name: string | null | undefined
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const colorMap: Record<string, string> = {
  A: 'bg-red-500', B: 'bg-blue-500', C: 'bg-green-500', D: 'bg-amber-500', E: 'bg-purple-500',
  F: 'bg-pink-500', G: 'bg-indigo-500', H: 'bg-teal-500', I: 'bg-cyan-500', J: 'bg-orange-500',
  K: 'bg-emerald-500', L: 'bg-violet-500', M: 'bg-fuchsia-500', N: 'bg-rose-500', O: 'bg-sky-500',
  P: 'bg-red-600', Q: 'bg-blue-600', R: 'bg-green-600', S: 'bg-amber-600', T: 'bg-purple-600',
  U: 'bg-pink-600', V: 'bg-indigo-600', W: 'bg-teal-600', X: 'bg-cyan-600', Y: 'bg-orange-600',
  Z: 'bg-emerald-600'
}

export function AvatarInitials({ name, className, size = 'md' }: AvatarInitialsProps) {
  const initials = (name || '?')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

  const firstLetter = initials[0] || '?'
  const bgColor = colorMap[firstLetter] || 'bg-gray-500'

  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-lg',
  }

  return (
    <div className={cn(
      "flex items-center justify-center rounded-full text-white font-semibold flex-shrink-0",
      bgColor,
      sizeClasses[size],
      className
    )}>
      {initials}
    </div>
  )
}
