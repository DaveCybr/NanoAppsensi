"use client"

import React from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AvatarInitials } from '@/components/ui/AvatarInitials'
import { 
  Briefcase, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  UserSquare2,
  Clock,
  Fingerprint,
  Camera,
  History
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const tabs = [
    { id: 'profile', label: 'Profil Lengkap', icon: UserSquare2 },
    { id: 'attendance', label: 'Absensi', icon: Clock },
    { id: 'leave', label: 'Cuti', icon: Calendar },
    { id: 'settings', label: 'Keamanan', icon: Fingerprint },
  ]
  const [activeTab, setActiveTab] = React.useState('profile')

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Detail Karyawan" 
        breadcrumbs={[{ label: 'Karyawan', href: '/karyawan' }, { label: 'Andi Saputra' }]}
      >
        <button className="btn-outline">Keluarkan Akun</button>
        <button className="btn-primary">Ubah Profil</button>
      </PageHeader>

      {/* Profile Header Card */}
      <div className="bg-sidebar p-8 rounded-2xl shadow-xl relative overflow-hidden text-white flex flex-col md:flex-row gap-8 items-center md:items-end">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32" />
        
        <div className="relative group">
          <AvatarInitials name="Andi Saputra" size="xl" className="ring-4 ring-primary/30 w-32 h-32 md:w-36 md:h-36 text-3xl" />
          <button className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded-full shadow-lg group-hover:scale-110 transition-transform">
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center md:text-left space-y-2 relative h-full flex flex-col justify-end pb-2">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h2 className="text-3xl font-bold">Andi Saputra</h2>
            <StatusBadge status="active" className="bg-green-500/20 text-green-400 border-none px-3" />
          </div>
          <p className="text-white/60 font-medium">Senior Software Engineer • <span className="text-primary font-bold">IT & Engineering</span></p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
            <div className="flex items-center gap-2 text-white/40 text-xs">
              <UserSquare2 className="w-4 h-4" />
              <span>EMP001</span>
            </div>
            <div className="flex items-center gap-2 text-white/40 text-xs">
              <Calendar className="w-4 h-4" />
              <span>Bergabung: 12 Jan 2022</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border w-fit mx-auto lg:mx-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all",
              activeTab === tab.id 
                ? "bg-muted text-primary shadow-sm" 
                : "text-muted-foreground hover:bg-slate-50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h3 className="text-lg font-bold">Data Pribadi</h3>
              <Briefcase className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email Perusahaan</p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <p className="font-semibold">andi@nanoapp.com</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nomor Telepon</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <p className="font-semibold">+62 812-3456-7890</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Alamat Domisili</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <p className="font-semibold text-sm leading-relaxed">Jl. Melati IV No. 45, Jakarta Selatan</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h3 className="text-lg font-bold">Face Recognition</h3>
              <p className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">TERDAFTAR</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="w-32 h-40 bg-muted rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Andi" alt="Face preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-4 text-center sm:text-left">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Data wajah digunakan untuk validasi check-in via perangkat mobile. Pastikan foto jelas tanpa kacamata hitam atau topi.
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <button className="btn-primary text-xs px-6">Upload Foto Baru</button>
                  <button className="btn-outline text-xs px-6">Hapus Data Wajah</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6 text-left">
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Informasi Kontrak</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                  <History className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-muted-foreground">Tipe Karyawan</p>
                  <p className="text-sm font-bold">Karyawan Tetap (PKWTT)</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-2 bg-amber-50 rounded-lg shrink-0">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-muted-foreground">Jam Kerja / Shift</p>
                  <p className="text-sm font-bold">Reguler (08:00 - 17:00)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Statistik Bulan Ini</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Hadir</span>
                <span className="text-sm font-bold">22 Hari</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Terlambat</span>
                <span className="text-sm font-bold text-amber-600">2 Hari</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tanpa Kabar (Alpha)</span>
                <span className="text-sm font-bold text-red-600">0 Hari</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
