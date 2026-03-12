"use client"

import React from 'react'
import { 
  Clock, 
  Edit, 
  Trash2, 
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useApi } from '@/hooks/useApi'

export function ShiftTable() {
  const { data: shifts, loading } = useApi<any[]>('/api/shifts')

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden text-left">
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Daftar Shift Kerja</h3>
          <p className="text-xs text-muted-foreground mt-1">Konfigurasi jam kerja operasional</p>
        </div>
        <button className="btn-primary text-xs px-4">Tambah Shift</button>
      </div>
      
      <div className="overflow-x-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center min-h-[120px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <table className="w-full">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-left">Nama Shift</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-left">Jam Kerja</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-left">Tipe</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-left">
            {shifts?.map((shift: any) => (
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
                  <span className="text-sm font-medium">{shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)} WIB</span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter",
                    shift.is_overnight ? "bg-purple-50 text-purple-600 border border-purple-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                  )}>
                    {shift.is_overnight ? 'Lintas Hari' : 'Satu Hari'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-muted rounded-md transition-colors"><Edit className="w-4 h-4" /></button>
                    <button className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && (!shifts || shifts.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">
                  Belum ada shift yang dikonfigurasi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
