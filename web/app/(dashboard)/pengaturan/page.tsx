"use client"

import React, { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { CompanySettings } from '@/components/pengaturan/CompanySettings'
import { DepartmentManager } from '@/components/pengaturan/DepartmentManager'
import { LeaveTypeManager } from '@/components/pengaturan/LeaveTypeManager'
import { WorkLocationManager } from '@/components/pengaturan/WorkLocationManager'
import { 
  Building2, 
  Users, 
  Calendar, 
  MapPin,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const tabs = [
  { id: 'company', label: 'Perusahaan', icon: Building2 },
  { id: 'departments', label: 'Departemen & Jabatan', icon: Users },
  { id: 'leave', label: 'Jenis Cuti', icon: Calendar },
  { id: 'locations', label: 'Lokasi Kerja', icon: MapPin },
]

export default function PengaturanPage() {
  const [activeTab, setActiveTab] = useState('company')

  return (
    <div className="space-y-8">
      <PageHeader title="Pengaturan">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg">
          <Shield className="w-3.5 h-3.5" />
          <span className="font-medium">Hanya HR Manager & Admin</span>
        </div>
      </PageHeader>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all",
              activeTab === tab.id 
                ? "bg-primary text-white shadow-sm shadow-primary/30" 
                : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'company' && <CompanySettings />}
        {activeTab === 'departments' && <DepartmentManager />}
        {activeTab === 'leave' && <LeaveTypeManager />}
        {activeTab === 'locations' && <WorkLocationManager />}
      </div>
    </div>
  )
}
