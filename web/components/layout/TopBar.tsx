"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Search, Bell, Menu, ChevronDown, Globe, Check, Loader2, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AvatarInitials } from '@/components/ui/AvatarInitials'
import { useApi } from '@/hooks/useApi'
import { formatRelative } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface TopBarProps {
  onMobileMenuOpen: () => void
}

export function TopBar({ onMobileMenuOpen }: TopBarProps) {
  const { user, tenant, logout } = useAuth()
  const [notifOpen, setNotifOpen]   = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef   = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const { data: notifData, refetch: refetchNotif } = useApi<any>('/api/notifications?limit=10')
  const notifications  = notifData?.notifications ?? []
  const unreadCount    = notifData?.unread_count ?? 0

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
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
    <header className="fixed top-0 right-0 left-0 md:left-auto md:w-[calc(100%-16rem)] h-16 bg-white border-b z-30 flex items-center justify-between px-4 md:px-8 transition-all duration-300">
      {/* Left: Mobile menu + Search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMobileMenuOpen}
          className="p-2 md:hidden hover:bg-muted rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative max-w-sm w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari fitur, karyawan..."
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl text-sm transition-all outline-none"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Tenant Name */}
        {tenant && (
          <div className="hidden lg:block px-3 py-1 bg-primary/5 rounded-lg">
            <p className="text-xs font-bold text-primary truncate max-w-[120px]">{tenant.name}</p>
          </div>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(o => !o); setProfileOpen(false) }}
            className="p-2 hover:bg-muted rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b flex items-center justify-between">
                <h4 className="font-bold text-sm">
                  Notifikasi {unreadCount > 0 && <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded">{unreadCount}</span>}
                </h4>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary font-semibold hover:underline">
                      Tandai semua
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-muted rounded">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Tidak ada notifikasi
                  </div>
                ) : (
                  notifications.map((n: any) => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && markRead(n.id)}
                      className={cn(
                        "p-4 flex gap-3 cursor-pointer hover:bg-muted/30 transition-colors",
                        !n.is_read && "bg-primary/5"
                      )}
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        n.is_read ? "bg-muted" : "bg-primary"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{n.title}</p>
                        {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{formatRelative(n.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative pl-3 border-l ml-1" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(o => !o); setNotifOpen(false) }}
            className="flex items-center gap-3 hover:bg-muted p-1.5 rounded-xl transition-colors"
          >
            <div className="hidden lg:block text-right">
              <p className="text-xs font-semibold leading-none mb-1">{user?.full_name ?? 'Admin'}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{user?.role_name}</p>
            </div>
            <AvatarInitials name={user?.full_name} size="sm" />
            <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform hidden lg:block", profileOpen && "rotate-180")} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b">
                <p className="text-sm font-bold truncate">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => { setProfileOpen(false); logout() }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
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