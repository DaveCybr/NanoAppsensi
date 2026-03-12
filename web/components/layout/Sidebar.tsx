"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  RefreshCw,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AvatarInitials } from '@/components/ui/AvatarInitials'

const navGroups = [
  {
    label: 'Utama',
    items: [
      { label: 'Dashboard',  href: '/dashboard',  icon: LayoutDashboard },
      { label: 'Karyawan',   href: '/karyawan',   icon: Users },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { label: 'Absensi',    href: '/absensi',    icon: Clock },
      { label: 'Cuti',       href: '/cuti',       icon: CalendarDays },
      { label: 'Shift & Libur', href: '/shift',   icon: RefreshCw },
    ],
  },
  {
    label: 'Konfigurasi',
    items: [
      { label: 'Pengaturan', href: '/pengaturan', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-40 hidden md:flex flex-col transition-all duration-300',
        'bg-sidebar text-sidebar-foreground border-r border-white/[0.06]',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}
    >
      {/* ── Logo ── */}
      <div className="h-[52px] flex items-center justify-between px-3 border-b border-white/[0.06] shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <div className="leading-none overflow-hidden">
              <div className="text-[13px] font-semibold text-white truncate">NanoApp</div>
              <div className="text-[9px] font-medium text-white/35 uppercase tracking-[0.08em] mt-0.5">HR System</div>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
            <span className="text-white font-bold text-xs">N</span>
          </div>
        )}

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5 scrollbar-hide">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {!collapsed && (
              <div className="px-2 mb-1.5 text-[9px] font-semibold text-white/25 uppercase tracking-[0.1em]">
                {group.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-all duration-150 relative group',
                        isActive
                          ? 'bg-white/10 text-white font-medium'
                          : 'text-white/50 hover:text-white/85 hover:bg-white/6',
                        collapsed && 'justify-center px-0',
                      )}
                    >
                      {/* active indicator */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] bg-primary rounded-r-full" />
                      )}
                      <item.icon
                        className={cn('shrink-0 transition-transform', collapsed ? 'w-4.5 h-4.5' : 'w-4 h-4')}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}

                      {/* Tooltip for collapsed */}
                      {collapsed && (
                        <div className="absolute left-full ml-2.5 px-2.5 py-1.5 bg-[#1e2433] text-white text-xs rounded-md
                                        opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity
                                        whitespace-nowrap shadow-xl border border-white/10 z-50">
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

      {/* ── User footer ── */}
      <div className="shrink-0 border-t border-white/[0.06] p-2">
        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex items-center justify-center p-2 rounded-md text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors mb-1"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        <div
          className={cn(
            'flex items-center gap-2.5 p-2 rounded-md hover:bg-white/6 transition-colors',
            collapsed && 'justify-center',
          )}
        >
          <AvatarInitials
            name={user?.full_name}
            size="sm"
            className="ring-1 ring-white/15 shrink-0 w-6 h-6 text-[9px]"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-white/85 truncate leading-none">
                {user?.full_name || 'Admin'}
              </div>
              <div className="text-[9.5px] text-white/30 uppercase tracking-[0.06em] mt-0.5 font-medium truncate">
                {user?.role_name || 'Administrator'}
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              title="Keluar"
              className="p-1 rounded text-white/25 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}