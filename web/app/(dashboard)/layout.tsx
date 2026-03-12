"use client"

import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { MobileNav } from '@/components/layout/MobileNav'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  React.useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSkeleton variant="stats" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />

      {/* Mobile nav */}
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Offset container — left matches sidebar width */}
      <div className="md:pl-[220px] transition-all duration-300 flex flex-col min-h-screen">
        <TopBar onMobileMenuOpen={() => setMobileMenuOpen(true)} />

        {/* Page body */}
        <main className="flex-1 mt-[52px] p-5 md:p-7 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-3 duration-400 fill-mode-both">
            {children}
          </div>
        </main>

        <footer className="py-3 px-6 border-t border-border bg-white text-center text-[11px] text-muted-foreground/60">
          © {new Date().getFullYear()} NanoApp HR System
        </footer>
      </div>
    </div>
  )
}