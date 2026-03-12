"use client"

import React from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Check, X, Clock, User, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const pendingCorrections = [
  { id: '1', name: 'Andi Saputra', date: '08 Mar 2024', original: '09:12 (LATE)', correction: '07:55 (PRESENT)', reason: 'Aplikasi sempat error/crash saat check-in' },
  { id: '2', name: 'Siti Aminah', date: '07 Mar 2024', original: 'Absent', correction: '08:00 (PRESENT)', reason: 'Lupa bawa HP, sudah lapor security' },
]

export function CorrectionReview() {
  return (
    <div className="bg-card rounded-2xl border-2 border-primary/10 shadow-sm overflow-hidden text-left">
      <div className="p-6 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Butuh Tinjauan ({pendingCorrections.length})</h3>
            <p className="text-xs text-primary/70 font-semibold tracking-wider uppercase">Permohonan Koreksi Absensi</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-primary/5">
        {pendingCorrections.map((item) => (
          <div key={item.id} className="p-6 hover:bg-muted/30 transition-colors flex flex-col md:flex-row gap-6 md:items-center">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">{item.name}</span>
                <span className="text-xs text-muted-foreground">• {item.date}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="px-3 py-1.5 bg-red-50 rounded-lg border border-red-100 flex flex-col">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">Sistem</span>
                  <span className="text-xs font-bold text-red-600 line-through">{item.original}</span>
                </div>
                <div className="w-4 h-4 text-muted-foreground flex items-center justify-center">→</div>
                <div className="px-3 py-1.5 bg-green-50 rounded-lg border border-green-100 flex flex-col">
                  <span className="text-[10px] font-bold text-green-400 uppercase tracking-tighter">Koreksi</span>
                  <span className="text-xs font-bold text-green-600">{item.correction}</span>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg text-xs italic text-muted-foreground border-l-4 border-muted-foreground/20">
                "{item.reason}"
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex-1 md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                <Check className="w-3.5 h-3.5" /> Setujui
              </button>
              <button className="flex-1 md:w-auto px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                <X className="w-3.5 h-3.5" /> Tolak
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
