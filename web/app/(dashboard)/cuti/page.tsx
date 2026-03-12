"use client"

import React, { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { LeaveTable } from '@/components/cuti/LeaveTable'
import { LeaveDrawer } from '@/components/cuti/LeaveDrawer'
import { 
  Plus, 
  Calendar, 
  Search, 
  Clock,
  CheckCircle2,
  BarChart2,
  Loader2
} from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { useDebounce } from '@/hooks/useDebounce'
import { formatNumber, formatDate } from '@/lib/utils/format'

export default function CutiPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  const debouncedSearch = useDebounce(search, 500)

  // Query params
  const queryParams = new URLSearchParams()
  if (statusFilter) queryParams.set('status', statusFilter)
  queryParams.set('year', String(selectedYear))
  queryParams.set('limit', '50')

  const { data: leaveData, loading, refetch } = useApi<any>(`/api/leave/requests?${queryParams.toString()}`)
  const rawLeaves = leaveData?.data || []
  
  // Filter search locally for now as API might not support it directly in LeaveQuerySchema 
  // (Wait, LeaveQuerySchema doesn't have search, but route handler doesn't seem to use it either)
  const leaves = rawLeaves.filter((l: any) => 
    l.employee?.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const stats = {
    pending: rawLeaves.filter((l: any) => l.status === 'pending').length,
    approvedOfMonth: rawLeaves.filter((l: any) => l.status === 'approved').length,
    rejected: rawLeaves.filter((l: any) => l.status === 'rejected').length,
  }

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    let rejection_note = ''
    if (action === 'reject') {
      const note = prompt('Masukkan alasan penolakan (minimal 10 karakter):')
      if (!note) return
      if (note.length < 10) {
        alert('Alasan penolakan terlalu pendek.')
        return
      }
      rejection_note = note
    } else {
      if (!confirm('Apakah Anda yakin ingin menyetujui pengajuan cuti ini?')) return
    }

    try {
      const res = await fetch(`/api/leave/requests/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejection_note })
      })
      const json = await res.json()
      if (json.success) {
        refetch()
      } else {
        alert(json.error || 'Gagal memproses pengajuan')
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem')
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Manajemen Cuti">
        <button onClick={() => setDrawerOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Ajukan Cuti
        </button>
      </PageHeader>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="text-left text-left">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Menunggu Persetujuan</p>
            <p className="text-2xl font-extrabold">{formatNumber(stats.pending)} Permohonan</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Disetujui</p>
            <p className="text-2xl font-extrabold">{formatNumber(stats.approvedOfMonth)} Karyawan</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ditolak</p>
            <p className="text-2xl font-extrabold">{formatNumber(stats.rejected)} Pengajuan</p>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-card p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Cari nama karyawan..." 
            className="w-full pl-10 pr-4 py-2 bg-muted/30 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg text-sm transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            className="flex-1 md:w-40 px-3 py-2 bg-muted/30 border-transparent rounded-lg text-sm outline-none focus:bg-white transition-all appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select 
              className="pl-10 pr-8 py-2 bg-muted/30 border-transparent rounded-lg text-sm outline-none focus:bg-white appearance-none cursor-pointer font-medium"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="w-full relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        <LeaveTable 
          data={leaves.map((l: any) => ({
            id: l.id,
            employee_name: l.employee?.full_name || 'Unknown',
            leave_type: l.leave_type?.name || '-',
            start_date: formatDate(l.start_date, 'short'),
            end_date: formatDate(l.end_date, 'short'),
            days: l.total_days,
            reason: l.reason,
            status: l.status,
            submitted_at: formatDate(l.created_at, 'short')
          }))}
          onApprove={(record) => handleReview(record.id, 'approve')}
          onReject={(record) => handleReview(record.id, 'reject')}
          onView={() => alert('Fitur detail sedang dikembangkan')}
        />
      </div>

      <LeaveDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        onSuccess={() => {
          refetch()
        }} 
      />
    </div>
  )
}
