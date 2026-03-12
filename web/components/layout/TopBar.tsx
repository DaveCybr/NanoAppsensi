"use client"

import React from 'react'
import { 
  Search, 
  Bell, 
  MessageSquare,
  Menu,
  ChevronDown,
  Globe
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AvatarInitials } from '@/components/ui/AvatarInitials'

interface TopBarProps {
  onMobileMenuOpen: () => void
}

export function TopBar({ onMobileMenuOpen }: TopBarProps) {
  const { user } = useAuth()

  return (
    <header className="fixed top-0 right-0 left-0 md:left-auto md:w-[calc(100%-16rem)] h-16 bg-white border-b z-30 flex items-center justify-between px-4 md:px-8 transition-all duration-300">
      {/* Mobile Menu & Search */}
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
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl text-sm transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Language Switch */}
        <button className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded-lg transition-colors text-sm font-medium">
          <Globe className="w-4 h-4" />
          <span>ID</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        {/* User Profile Dropdown (Simplified) */}
        <div className="flex items-center gap-3 pl-4 border-l ml-2">
          <div className="hidden lg:block text-right">
            <p className="text-xs font-semibold leading-none mb-1">{user?.full_name || 'Admin'}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{user?.role_name}</p>
          </div>
          <button className="flex items-center gap-2 hover:bg-muted p-1 rounded-full transition-colors">
            <AvatarInitials name={user?.full_name} size="sm" />
          </button>
        </div>
      </div>
    </header>
  )
}
