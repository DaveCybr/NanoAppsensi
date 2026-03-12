"use client"

import React from 'react'
import { X, MapPin, Camera, Calendar, Clock, AlertCircle } from 'lucide-react'
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
              <p className="text-[10px] text-muted-foreground">
                {record.employee?.shift ? `Jadwal: ${record.employee.shift.start_time?.slice(0,5)} WIB` : ''}
              </p>
            </div>
            <div className="p-4 border rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Jam Keluar</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {record.check_out ? formatTime(record.check_out) : '--:--'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {record.employee?.shift ? `Jadwal: ${record.employee.shift.end_time?.slice(0,5)} WIB` : ''}
              </p>
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" /> Validasi Foto (Face Match)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-center">
                <div className="aspect-[3/4] bg-muted rounded-xl overflow-hidden border-2 border-primary/20 flex items-center justify-center">
                  {record.check_in_photo_url ? (
                    <img src={record.check_in_photo_url} className="w-full h-full object-cover" alt="Check-in photo" />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground/30" />
                  )}
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Foto Masuk</p>
                {record.check_in_face_confidence != null && (
                  <p className="text-[10px] text-muted-foreground">Confidence: {Math.round(record.check_in_face_confidence)}%</p>
                )}
              </div>
              <div className="space-y-2 text-center">
                <div className="aspect-[3/4] bg-muted rounded-xl overflow-hidden border-2 border-primary/20 flex items-center justify-center">
                  {record.check_out_photo_url ? (
                    <img src={record.check_out_photo_url} className="w-full h-full object-cover" alt="Check-out photo" />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground/30" />
                  )}
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Foto Keluar</p>
                {record.check_out_face_confidence != null && (
                  <p className="text-[10px] text-muted-foreground">Confidence: {Math.round(record.check_out_face_confidence)}%</p>
                )}
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
              {record.check_in_lat && record.check_in_lng ? (
                <>
                  <p className="text-xs font-medium">Lokasi Check-in</p>
                  <p className="text-[10px] mt-1">{record.check_in_lat}, {record.check_in_lng}</p>
                </>
              ) : (
                <p className="text-xs font-medium italic">Data lokasi tidak tersedia</p>
              )}
            </div>
            <div className={cn(
              "p-3 rounded-lg flex items-center gap-3 text-xs font-semibold",
              record.check_in_is_valid_location ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            )}>
              <AlertCircle className="w-4 h-4" />
              {record.check_in_is_valid_location ? 'Berada di dalam radius kantor (HQ Jakarta)' : 'Berada di luar radius kantor yang diizinkan'}
            </div>
          </div>

          {/* Work Hours Info */}
          {record.work_hours != null && (
            <div className="p-4 bg-muted/20 rounded-xl flex items-center gap-4">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Jam Kerja</p>
                <p className="text-sm font-medium">
                  {record.work_hours} jam
                  {record.overtime_hours > 0 && ` (Lembur: ${record.overtime_hours} jam)`}
                </p>
              </div>
            </div>
          )}
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

