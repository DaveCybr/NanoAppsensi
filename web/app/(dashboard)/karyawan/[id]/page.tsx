"use client"

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AvatarInitials } from '@/components/ui/AvatarInitials'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import {
  Briefcase, Calendar, Mail, Phone, MapPin,
  Clock, Fingerprint, Camera, History, Loader2,
  Building2, UserSquare2, Edit
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useApi } from '@/hooks/useApi'
import { formatDate } from '@/lib/utils/format'

const TABS = [
  { id: 'profile',   label: 'Profil',         icon: UserSquare2 },
  { id: 'attendance', label: 'Absensi',         icon: Clock },
  { id: 'leave',     label: 'Cuti',            icon: Calendar },
  { id: 'security',  label: 'Keamanan',        icon: Fingerprint },
]

export default function EmployeeDetailPage() {
  const { id }   = useParams()
  const [tab, setTab] = useState('profile')

  const { data: employee, loading, error } = useApi<any>(id ? `/api/employees/${id}` : null)

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSkeleton variant="stats" />
    </div>
  )

  if (error) return (
    <div className="text-center py-20 px-4">
      <div className="text-red-500 font-semibold mb-2">Terjadi Kesalahan</div>
      <p className="text-muted-foreground text-[13px]">{error}</p>
    </div>
  )

  if (!employee) return (
    <div className="text-center py-20 text-muted-foreground text-[13px]">
      Karyawan tidak ditemukan.
    </div>
  )

  const name      = employee.full_name || 'Unknown'
  const position  = employee.position?.name   || '—'
  const dept      = employee.department?.name || '—'
  const code      = employee.employee_code    || '—'
  const shiftName = employee.shift
    ? `${employee.shift.name} · ${employee.shift.start_time?.slice(0,5)}–${employee.shift.end_time?.slice(0,5)}`
    : 'Belum diatur'

  return (
    <div className="space-y-5">
      <PageHeader
        title="Detail Karyawan"
        breadcrumbs={[{ label: 'Karyawan', href: '/karyawan' }, { label: name }]}
      >
        <button className="btn-outline">Keluarkan Akun</button>
        <button className="btn-primary">
          <Edit className="w-3.5 h-3.5 mr-1.5" />
          Edit Profil
        </button>
      </PageHeader>

      {/* ── Hero card ── */}
      <div className="card-base overflow-hidden">
        {/* Cover strip */}
        <div className="h-[80px] bg-gradient-to-r from-slate-800 to-slate-700 relative">
          <div className="absolute inset-0 opacity-10"
               style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(221 83% 53%) 0%, transparent 60%), radial-gradient(circle at 80% 50%, hsl(260 83% 60%) 0%, transparent 60%)' }} />
        </div>

        <div className="px-6 pb-5">
          {/* Avatar overlapping cover */}
          <div className="flex items-end gap-4 -mt-8 mb-4">
            <div className="relative">
              <AvatarInitials
                name={name}
                size="xl"
                className="w-16 h-16 text-[20px] ring-3 ring-white shadow-md"
              />
              <button className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow border-2 border-white">
                <Camera className="w-2.5 h-2.5 text-white" />
              </button>
            </div>

            <div className="pb-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[18px] font-semibold text-foreground tracking-tight">{name}</h2>
                <StatusBadge status={employee.employment_status || 'active'} />
              </div>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {position}
                <span className="text-border mx-1.5">·</span>
                <span className="text-primary font-medium">{dept}</span>
              </p>
            </div>

            {/* Quick info chips */}
            <div className="hidden lg:flex items-center gap-2 pb-1">
              {[
                { icon: UserSquare2, val: code },
                { icon: Calendar,    val: `Bergabung ${formatDate(employee.hire_date, 'short')}` },
              ].map(({ icon: Icon, val }) => (
                <div key={val} className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/60 rounded-md border border-border/60">
                  <Icon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[12px] text-muted-foreground">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile quick info */}
          <div className="flex flex-wrap items-center gap-2 lg:hidden">
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <UserSquare2 className="w-3 h-3" />{code}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Calendar className="w-3 h-3" />Bergabung {formatDate(employee.hire_date, 'short')}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-0.5 bg-muted/40 p-1 rounded-lg border border-border/60 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[12.5px] font-medium transition-all',
              tab === t.id
                ? 'bg-white text-foreground shadow-sm border border-border/60'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Main info */}
          <div className="lg:col-span-2 space-y-4">
            <SectionCard title="Data Pribadi" icon={<Briefcase className="w-4 h-4" />}>
              <InfoGrid>
                <InfoItem icon={<Mail className="w-3.5 h-3.5 text-primary" />} label="Email" value={employee.email || '—'} />
                <InfoItem icon={<Phone className="w-3.5 h-3.5 text-primary" />} label="Telepon" value={employee.phone || '—'} />
                <InfoItem icon={<MapPin className="w-3.5 h-3.5 text-primary" />} label="Alamat" value={employee.address || '—'} span />
              </InfoGrid>
            </SectionCard>

            <SectionCard
              title="Face Recognition"
              icon={<Camera className="w-4 h-4" />}
              action={
                <span className={cn(
                  'text-[10.5px] font-semibold px-2 py-0.5 rounded border',
                  employee.face_image_url
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                    : 'bg-amber-50 text-amber-700 border-amber-200/60',
                )}>
                  {employee.face_image_url ? 'TERDAFTAR' : 'BELUM TERDAFTAR'}
                </span>
              }
            >
              <div className="flex items-start gap-6">
                <div className="w-24 h-32 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden shrink-0">
                  {employee.face_image_url
                    ? <img src={employee.face_image_url} alt="Face" className="w-full h-full object-cover" />
                    : <Camera className="w-6 h-6 text-muted-foreground/25" />}
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                    Data wajah digunakan untuk validasi check-in via aplikasi mobile. Pastikan foto jelas, tanpa kacamata hitam atau topi.
                  </p>
                  <div className="flex items-center gap-2">
                    <button className="btn-primary text-[12px] px-4 py-1.5">Upload Foto Baru</button>
                    {employee.face_image_url && (
                      <button className="btn-outline text-[12px] px-4 py-1.5 text-red-500 border-red-200 hover:bg-red-50">Hapus</button>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <SectionCard title="Informasi Kontrak" icon={<Briefcase className="w-4 h-4" />}>
              <div className="space-y-3">
                {[
                  { icon: <History className="w-3.5 h-3.5 text-blue-500" />,  bg: 'bg-blue-50',  label: 'Tipe Karyawan', val: employee.employment_status || '—' },
                  { icon: <Clock className="w-3.5 h-3.5 text-amber-500" />, bg: 'bg-amber-50', label: 'Shift Kerja',    val: shiftName },
                  { icon: <Building2 className="w-3.5 h-3.5 text-primary" />, bg: 'bg-primary/10', label: 'Departemen',   val: dept },
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-3">
                    <div className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0', row.bg)}>
                      {row.icon}
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground leading-none">{row.label}</p>
                      <p className="text-[13px] font-medium text-foreground mt-1 capitalize">{row.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card-base flex items-center justify-center py-16">
          <p className="text-[13px] text-muted-foreground">Riwayat absensi akan tampil di sini</p>
        </div>
      )}

      {tab === 'leave' && (
        <div className="card-base flex items-center justify-center py-16">
          <p className="text-[13px] text-muted-foreground">Riwayat cuti akan tampil di sini</p>
        </div>
      )}

      {tab === 'security' && (
        <div className="card-base flex items-center justify-center py-16">
          <p className="text-[13px] text-muted-foreground">Pengaturan keamanan akan tampil di sini</p>
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ── */

function SectionCard({ title, icon, action, children }: {
  title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="card-base">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <span className="text-muted-foreground">{icon}</span>
          {title}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">{children}</div>
}

function InfoItem({ icon, label, value, span }: {
  icon: React.ReactNode; label: string; value: string; span?: boolean
}) {
  return (
    <div className={cn('flex items-start gap-2.5', span && 'sm:col-span-2')}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-[11px] text-muted-foreground leading-none mb-1">{label}</p>
        <p className="text-[13px] font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}