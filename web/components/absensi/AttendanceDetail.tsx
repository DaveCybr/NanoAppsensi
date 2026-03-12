"use client"

import React from 'react'
import { X, MapPin, Camera, Smartphone, Calendar, Clock, AlertCircle } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AvatarInitials } from '@/components/ui/AvatarInitials'
import { cn } from '@/lib/utils/cn'
import { formatDate, formatTime } from '@/lib/utils/format'

interface AttendanceDetailProps {
  isOpen: boolean
  onClose: () => void
  record: any
}

export function AttendanceDetail({ isOpen, onClose, record }: AttendanceDetailProps) {
  if (!isOpen || !record) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white h-screen shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Detail Kehadiran</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(record.attendance_date, 'short')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 text-left">
          {/* Employee Info */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
            <AvatarInitials name={record.employee?.full_name || '?'} size="lg" />
            <div>
              <p className="font-bold text-lg">{record.employee?.full_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={record.status?.code || 'ABSENT'} />
                <span className="text-xs text-muted-foreground">ID: {record.id?.substring(0, 8)}</span>
                {record.employee?.employee_code && (
                  <span className="text-xs text-muted-foreground">Kode: {record.employee.employee_code}</span>
                )}
              </div>
            </div>
          </div>

          {/* Time Logs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Jam Masuk</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {record.check_in ? formatTime(record.check_in) : '--:--'}
              </p>
              <p className="text-[10px] text-muted-foreground">Jadwal: 08:00 WIB</p>
            </div>
            <div className="p-4 border rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Jam Keluar</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {record.check_out ? formatTime(record.check_out) : '--:--'}
              </p>
              <p className="text-[10px] text-muted-foreground">Jadwal: 17:00 WIB</p>
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" /> Validasi Foto (Face Match)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-center">
                <div className="aspect-[3/4] bg-muted rounded-xl overflow-hidden border-2 border-primary/20">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.employee?.full_name}_in`} className="w-full h-full object-cover" alt="Check-in photo" />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Foto Masuk</p>
              </div>
              <div className="space-y-2 text-center">
                <div className="aspect-[3/4] bg-muted rounded-xl overflow-hidden border-2 border-primary/20">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.employee?.full_name}_out`} className="w-full h-full object-cover" alt="Check-out photo" />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Foto Keluar</p>
              </div>
            </div>
          </div>

          {/* Map Location */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Lokasi Presensi (GPS)
            </h3>
            <div className="aspect-video bg-muted rounded-xl border flex flex-col items-center justify-center text-muted-foreground border-dashed">
              <MapPin className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-xs font-medium italic">Google Maps Placeholder</p>
              <p className="text-[10px] mt-1">-6.2088, 106.8456 (Radius: 15m)</p>
            </div>
            <div className={cn(
              "p-3 rounded-lg flex items-center gap-3 text-xs font-semibold",
              record.check_in_is_valid_location ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            )}>
              <AlertCircle className="w-4 h-4" />
              {record.check_in_is_valid_location ? 'Berada di dalam radius kantor (HQ Jakarta)' : 'Berada di luar radius kantor yang diizinkan'}
            </div>
          </div>

          {/* Device Info */}
          <div className="p-4 bg-muted/20 rounded-xl flex items-center gap-4">
            <Smartphone className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Perangkat</p>
              <p className="text-sm font-medium">iPhone 13 Pro (iOS 17.2) • App v2.4.1</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/10 flex items-center gap-2">
          <button className="flex-1 btn-outline">Ajukan Koreksi</button>
          <button className="flex-1 btn-primary">Unduh Report</button>
        </div>
      </div>
    </div>
  )
}

