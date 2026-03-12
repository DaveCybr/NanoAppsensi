"use client"

import React from 'react'
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  ArrowUpDown,
  Search,
  Filter
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AvatarInitials } from '@/components/ui/AvatarInitials'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'

interface Employee {
  id: string
  full_name: string
  employee_code: string
  department: string
  position: string
  status: 'active' | 'inactive' | 'resign'
  join_date: string
}

interface EmployeeTableProps {
  data: Employee[]
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}

export function EmployeeTable({ data, onEdit, onDelete }: EmployeeTableProps) {
  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="px-6 py-4">
                <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
              </th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                  Karyawan <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Departemen</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Jabatan</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Tgl Bergabung</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                <td className="px-6 py-4">
                  <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <AvatarInitials name={item.full_name} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        <Link href={`/karyawan/${item.id}`}>{item.full_name}</Link>
                      </p>
                      <p className="text-xs text-muted-foreground">{item.employee_code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-foreground">{item.department}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">{item.position}</span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={item.status === 'active' ? 'active' : 'inactive'} />
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-muted-foreground">{item.join_date}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/karyawan/${item.id}`} className="p-2 hover:bg-blue-50 text-blue-600 rounded-md transition-colors" title="Detail">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => onEdit(item)}
                      className="p-2 hover:bg-amber-50 text-amber-600 rounded-md transition-colors" 
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(item)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-md transition-colors" 
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Menampilkan 1 - {data.length} dari {data.length} karyawan</p>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 bg-white border rounded text-xs font-semibold disabled:opacity-50" disabled>Sebelumnya</button>
          <button className="px-3 py-1 bg-primary text-white rounded text-xs font-semibold">1</button>
          <button className="px-3 py-1 bg-white border rounded text-xs font-semibold">Berikutnya</button>
        </div>
      </div>
    </div>
  )
}
