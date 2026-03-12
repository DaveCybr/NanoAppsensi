"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Search, Bell, Menu, ChevronDown, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AvatarInitials } from '@/components/ui/AvatarInitials'
import { useApi } from '@/hooks/useApi'
import { formatRelative } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface TopBarProps {
  onMobileMenuOpen: () => void
  sidebarWidth?: string
}

export function TopBar({ onMobileMenuOpen, sidebarWidth = '220px' }: TopBarProps) {
  const { user, tenant, logout } = useAuth()
  const [notifOpen, setNotifOpen]     = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef   = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const { data: notifData, refetch: refetchNotif } = useApi<any>('/api/notifications?limit=10')
  const notifications = notifData?.notifications ?? []
  const unreadCount   = notifData?.unread_count   ?? 0

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))     setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    refetchNotif()
  }

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    refetchNotif()
  }

  return (
    <header
      className="fixed top-0 right-0 h-[52px] bg-white border-b border-border z-30
                 flex items-center justify-between px-4 gap-4 transition-all duration-300"
      style={{ left: `var(--sidebar-w, ${sidebarWidth})` }}
    >
      {/* ── Left ── */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuOpen}
          className="p-1.5 md:hidden hover:bg-muted rounded-md transition-colors text-muted-foreground"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        {/* Search */}
        <div className="topbar-search max-w-[260px] w-full hidden sm:flex">
          <Search className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <input placeholder="Cari karyawan, fitur..." />
          <kbd className="hidden lg:flex items-center gap-0.5 text-[10px] text-muted-foreground/40 font-medium ml-auto shrink-0">
            <span className="text-[11px]">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Company badge */}
        {tenant && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 rounded-md border border-border/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11.5px] font-medium text-muted-foreground truncate max-w-[140px]">
              {tenant.name}
            </span>
          </div>
        )}

        {/* Notif */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(o => !o); setProfileOpen(false) }}
            className={cn(
              'relative p-2 rounded-md transition-colors text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              notifOpen && 'bg-muted/60 text-foreground',
            )}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full
                               flex items-center justify-center px-1 border-[1.5px] border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-[340px] bg-white border border-border rounded-lg shadow-lg
                            z-50 overflow-hidden animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold">Notifikasi</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-100">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11.5px] text-primary font-medium hover:underline">
                      Tandai semua
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="p-0.5 hover:bg-muted rounded text-muted-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto divide-y divide-border/50">
                {notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Tidak ada notifikasi
                  </div>
                ) : (
                  notifications.map((n: any) => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && markRead(n.id)}
                      className={cn(
                        'flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors',
                        !n.is_read && 'bg-primary/[0.03]',
                      )}
                    >
                      <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', n.is_read ? 'bg-muted-foreground/20' : 'bg-primary')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold truncate">{n.title}</p>
                        {n.message && (
                          <p className="text-[11.5px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                        )}
                        <p className="text-[10.5px] text-muted-foreground/60 mt-1">{formatRelative(n.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(o => !o); setNotifOpen(false) }}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors',
              profileOpen && 'bg-muted/60',
            )}
          >
            <AvatarInitials name={user?.full_name} size="sm" className="w-6 h-6 text-[9px]" />
            <div className="hidden lg:block text-left leading-none">
              <div className="text-[12.5px] font-semibold text-foreground">{user?.full_name ?? 'Admin'}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{user?.role_name}</div>
            </div>
            <ChevronDown className={cn('w-3 h-3 text-muted-foreground hidden lg:block transition-transform', profileOpen && 'rotate-180')} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-[200px] bg-white border border-border rounded-lg shadow-lg
                            z-50 overflow-hidden animate-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-3 border-b border-border">
                <p className="text-[13px] font-semibold truncate">{user?.full_name}</p>
                <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => { setProfileOpen(false); logout() }}
                  className="w-full px-3 py-2 text-left text-[13px] text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium"
                >
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}