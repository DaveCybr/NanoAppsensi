"use client"

import React from 'react'
import { 
  Clock, 
  Edit, 
  Trash2, 
  MoreVertical,
  CalendarCheck
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Shift {
  id: string
  name: string
  start_time: string
  end_time: string
  is_overnight: boolean
  employee_count: number
}

const mockShifts: Shift[] = [
  { id: '1', name: 'Reguler (Pagi)', start_time: '08:00', end_time: '17:00', is_overnight: false, employee_count: 850 },
  { id: '2', name: 'Shift Sore', start_time: '14:00', end_time: '23:00', is_overnight: false, employee_count: 120 },
  { id: '3', name: 'Shift Malam', start_time: '22:00', end_time: '07:00', is_overnight: true, employee_count: 45 },
  { id: '4', name: 'Sabtu Setengah Hari', start_time: '08:00', end_time: '13:00', is_overnight: false, employee_count: 600 },
]

export function ShiftTable() {
  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden text-left">
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Daftar Shift Kerja</h3>
          <p className="text-xs text-muted-foreground mt-1">Konfigurasi jam kerja operasional</p>
        </div>
        <button className="btn-primary text-xs px-4">Tambah Shift</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-left">Nama Shift</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-left">Jam Kerja</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-left">Tipe</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-left">Karyawan</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-left text-left">
            {mockShifts.map((shift) => (
              <tr key={shift.id} className="hover:bg-muted/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold">{shift.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium">{shift.start_time} - {shift.end_time} WIB</span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter",
                    shift.is_overnight ? "bg-purple-50 text-purple-600 border border-purple-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                  )}>
                    {shift.is_overnight ? 'Lintas Hari' : 'Satu Hari'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold">{shift.employee_count} Org</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-muted rounded-md transition-colors"><Edit className="w-4 h-4" /></button>
                    <button className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
