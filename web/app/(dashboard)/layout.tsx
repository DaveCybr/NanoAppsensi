"use client"

import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { cn } from '@/lib/utils/cn'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Auth Guard
  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <LoadingSkeleton variant="stats" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden animate-in fade-in duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="transition-all duration-300 flex flex-col min-h-screen md:pl-64">
        <TopBar onMobileMenuOpen={() => setMobileMenuOpen(true)} />
        
        <main className="flex-1 mt-16 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="py-4 px-8 border-t bg-white text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} NanoApp HR System. Dibuat dengan &hearts; oleh Tim Pengembang.
        </footer>
      </div>
    </div>
  )
}
