"use client"

import React, { useState } from 'react'
import { Check, X, AlertCircle, Loader2 } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { formatDate, formatTime } from '@/lib/utils/format'

export function CorrectionReview() {
  const { data: corrections, loading, refetch } = useApi<any[]>('/api/attendance/corrections?status=pending')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    let rejection_note = ''

    if (action === 'reject') {
      const note = prompt('Masukkan alasan penolakan (minimal 10 karakter):')
      if (!note) return
      if (note.length < 10) {
        alert('Alasan penolakan terlalu pendek (minimal 10 karakter).')
        return
      }
      rejection_note = note
    } else {
      if (!confirm('Setujui koreksi absensi ini?')) return
    }

    setProcessingId(id)
    try {
      const res = await fetch(`/api/attendance/corrections/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // ✅ FIX: API expects { action } bukan { status }
        body: JSON.stringify({ action, rejection_note: rejection_note || undefined }),
      })
      const json = await res.json()
      if (json.success) {
        refetch()
      } else {
        alert(json.error || 'Gagal memproses koreksi')
      }
    } catch {
      alert('Terjadi kesalahan sistem')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="bg-card rounded-2xl border-2 border-primary/10 shadow-sm overflow-hidden text-left relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      <div className="p-6 bg-primary/5 border-b border-primary/10 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Butuh Tinjauan ({corrections?.length ?? 0})</h3>
          <p className="text-xs text-primary/70 font-semibold tracking-wider uppercase">Permohonan Koreksi Absensi</p>
        </div>
      </div>

      <div className="divide-y divide-primary/5">
        {corrections?.map((item: any) => {
          const isProcessing = processingId === item.id
          return (
            <div key={item.id} className="p-6 hover:bg-muted/30 transition-colors space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">{item.employee?.full_name}</span>
                <span className="text-xs text-muted-foreground">
                  • {formatDate(item.attendance?.attendance_date, 'short')}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="px-3 py-1.5 bg-red-50 rounded-lg border border-red-100 flex flex-col">
                  <span className="text-[10px] font-bold text-red-400 uppercase">Sistem</span>
                  <span className="text-xs font-bold text-red-600 line-through">
                    {formatTime(item.before_check_in)} • {item.attendance?.status?.name ?? 'Absent'}
                  </span>
                </div>
                <span className="text-muted-foreground text-sm">→</span>
                <div className="px-3 py-1.5 bg-green-50 rounded-lg border border-green-100 flex flex-col">
                  <span className="text-[10px] font-bold text-green-400 uppercase">Koreksi</span>
                  <span className="text-xs font-bold text-green-600">
                    {formatTime(item.after_check_in)} • {item.after_status?.name ?? '-'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg text-xs italic text-muted-foreground border-l-4 border-muted-foreground/20">
                "{item.reason}"
              </div>

              <div className="flex gap-2">
                <button
                  disabled={isProcessing}
                  onClick={() => handleAction(item.id, 'approve')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Setujui
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => handleAction(item.id, 'reject')}
                  className="flex-1 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  Tolak
                </button>
              </div>
            </div>
          )
        })}

        {!loading && (!corrections || corrections.length === 0) && (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Tidak ada permohonan koreksi pending
          </div>
        )}
      </div>
    </div>
  )
}