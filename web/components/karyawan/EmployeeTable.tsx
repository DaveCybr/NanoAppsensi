"use client"

import React from 'react'
import { Eye, Edit, Trash2, ArrowUpDown, Loader2, MoreHorizontal } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AvatarInitials } from '@/components/ui/AvatarInitials'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'

interface Employee {
  id:            string
  full_name:     string
  employee_code: string
  email?:        string
  department:    string
  position:      string
  status:        'active' | 'inactive' | 'resign'
  join_date:     string
}

interface EmployeeTableProps {
  data:     Employee[]
  loading?: boolean
  viewMode?: 'list' | 'grid'
  onEdit:   (emp: Employee) => void
  onDelete: (emp: Employee) => void
}

export function EmployeeTable({ data, loading, viewMode = 'list', onEdit, onDelete }: EmployeeTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-[13px]">Memuat data...</span>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <p className="text-[13px] font-medium text-muted-foreground">Tidak ada karyawan ditemukan</p>
        <p className="text-[12px] text-muted-foreground/60 mt-1">Coba ubah filter atau tambah karyawan baru</p>
      </div>
    )
  }

  /* ── Grid view ── */
  if (viewMode === 'grid') {
    return (
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {data.map((emp) => (
          <div
            key={emp.id}
            className="group relative bg-white border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              <AvatarInitials name={emp.full_name} size="md" className="w-10 h-10 text-[12px] shrink-0" />
              <div className="flex-1 min-w-0">
                <Link
                  href={`/karyawan/${emp.id}`}
                  className="text-[13.5px] font-semibold text-foreground hover:text-primary transition-colors truncate block"
                >
                  {emp.full_name}
                </Link>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5" style={{ fontFamily: 'Geist Mono, monospace' }}>
                  {emp.employee_code}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground/60 w-16 shrink-0">Dept</span>
                <span className="text-[12px] text-foreground truncate">{emp.department}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground/60 w-16 shrink-0">Jabatan</span>
                <span className="text-[12px] text-muted-foreground truncate">{emp.position}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <StatusBadge status={emp.status === 'active' ? 'active' : 'inactive'} />
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/karyawan/${emp.id}`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-600 transition-colors">
                  <Eye className="w-3.5 h-3.5" />
                </Link>
                <button onClick={() => onEdit(emp)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-amber-600 transition-colors">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(emp)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-600 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  /* ── List / table view ── */
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="pl-4 pr-2 py-2.5 w-8">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-border/80 text-primary focus:ring-primary/30 cursor-pointer" />
              </th>
              {[
                { label: 'Karyawan', sortable: true },
                { label: 'Departemen' },
                { label: 'Jabatan' },
                { label: 'Status' },
                { label: 'Bergabung' },
                { label: '', align: 'right' },
              ].map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    'px-3 py-2.5 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.06em] whitespace-nowrap',
                    col.align === 'right' && 'text-right',
                  )}
                  style={{ fontFamily: 'Geist Mono, monospace' }}
                >
                  {col.sortable ? (
                    <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                      {col.label} <ArrowUpDown className="w-2.5 h-2.5" />
                    </button>
                  ) : col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((emp, idx) => (
              <tr
                key={emp.id}
                className="group border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors duration-100"
              >
                <td className="pl-4 pr-2 py-3">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-border/80 text-primary focus:ring-primary/30 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>

                {/* Employee */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <AvatarInitials name={emp.full_name} size="sm" className="w-7 h-7 text-[9.5px] shrink-0" />
                    <div className="min-w-0">
                      <Link
                        href={`/karyawan/${emp.id}`}
                        className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors truncate block leading-none"
                      >
                        {emp.full_name}
                      </Link>
                      <span
                        className="text-[10.5px] text-muted-foreground/60 mt-0.5 block"
                        style={{ fontFamily: 'Geist Mono, monospace' }}
                      >
                        {emp.employee_code}
                        {emp.email && <span className="ml-1.5 text-muted-foreground/40">· {emp.email}</span>}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Dept */}
                <td className="px-3 py-3">
                  <span className="text-[13px] text-foreground">{emp.department}</span>
                </td>

                {/* Position */}
                <td className="px-3 py-3">
                  <span className="text-[12.5px] text-muted-foreground">{emp.position}</span>
                </td>

                {/* Status */}
                <td className="px-3 py-3">
                  <StatusBadge status={emp.status === 'active' ? 'active' : 'inactive'} />
                </td>

                {/* Join date */}
                <td className="px-3 py-3">
                  <span className="text-[12px] text-muted-foreground" style={{ fontFamily: 'Geist Mono, monospace' }}>
                    {emp.join_date}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/karyawan/${emp.id}`}
                      className="p-1.5 rounded-md hover:bg-blue-50 text-muted-foreground hover:text-blue-600 transition-colors"
                      title="Lihat detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => onEdit(emp)}
                      className="p-1.5 rounded-md hover:bg-amber-50 text-muted-foreground hover:text-amber-600 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(emp)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer pagination */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/60 bg-muted/10">
        <p className="text-[12px] text-muted-foreground">
          Menampilkan <span className="font-medium text-foreground">{data.length}</span> karyawan
        </p>
        <div className="flex items-center gap-1">
          <button className="px-2.5 py-1 text-[12px] font-medium border border-border rounded-md bg-white text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors" disabled>
            Sebelumnya
          </button>
          <button className="px-2.5 py-1 text-[12px] font-medium bg-primary text-white rounded-md">1</button>
          <button className="px-2.5 py-1 text-[12px] font-medium border border-border rounded-md bg-white text-muted-foreground hover:text-foreground transition-colors">
            Berikutnya
          </button>
        </div>
      </div>
    </>
  )
}