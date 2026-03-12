"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { 
  BarChart3, 
  Users, 
  Clock, 
  Calendar, 
  Repeat, 
  Settings, 
  X,
  ShieldCheck
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { label: 'Karyawan', href: '/karyawan', icon: Users },
  { label: 'Absensi', href: '/absensi', icon: Clock },
  { label: 'Cuti', href: '/cuti', icon: Calendar },
  { label: 'Shift & Libur', href: '/shift', icon: Repeat },
  { label: 'Pengaturan', href: '/pengaturan', icon: Settings },
]

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] md:hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-sidebar text-sidebar-foreground shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">NanoApp</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-primary text-white font-semibold shadow-lg shadow-primary/20" 
                    : "hover:bg-white/5 text-sidebar-foreground/70"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="text-base">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-white/5 text-center">
          <p className="text-xs text-muted-foreground/40 font-medium">NanoApp HR System v1.0</p>
        </div>
      </div>
    </div>
  )
}
