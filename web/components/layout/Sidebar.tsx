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
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AvatarInitials } from '@/components/ui/AvatarInitials'

const navGroups = [
  {
    label: 'Utama',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
      { label: 'Karyawan', href: '/karyawan', icon: Users },
    ]
  },
  {
    label: 'Operasional',
    items: [
      { label: 'Absensi', href: '/absensi', icon: Clock },
      { label: 'Cuti', href: '/cuti', icon: Calendar },
      { label: 'Shift & Libur', href: '/shift', icon: Repeat },
    ]
  },
  {
    label: 'Konfigurasi',
    items: [
      { label: 'Pengaturan', href: '/pengaturan', icon: Settings },
    ]
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-40 hidden md:flex flex-col shadow-xl",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        <div className={cn("flex items-center gap-3 transition-opacity duration-300", collapsed && "opacity-0 invisible w-0")}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">NanoApp</span>
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-8 scrollbar-hide">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-2">
            {!collapsed && (
              <h4 className="px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
                {group.label}
              </h4>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative",
                        isActive 
                          ? "bg-primary text-white shadow-lg shadow-primary/20 font-medium" 
                          : "hover:bg-white/5 text-sidebar-foreground/70 hover:text-white"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "" : "group-hover:scale-110 transition-transform")} />
                      {!collapsed && <span className="text-sm truncate">{item.label}</span>}
                      
                      {collapsed && (
                        <div className="absolute left-full ml-4 px-2 py-1 bg-sidebar text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 mt-auto border-t border-white/5">
        <div className={cn(
          "flex items-center gap-3 transition-all duration-300 bg-white/5 p-2 rounded-xl",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-3 min-w-0">
            <AvatarInitials name={user?.full_name} size="sm" className="ring-2 ring-primary/20" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{user?.full_name || 'Admin'}</p>
                <p className="text-[10px] text-muted-foreground/60 truncate uppercase font-bold tracking-tighter">
                  {user?.role_name || 'Administrator'}
                </p>
              </div>
            )}
          </div>
          
          {!collapsed && (
            <button 
              onClick={logout}
              className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
