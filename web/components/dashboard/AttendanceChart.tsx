"use client"

import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useApi } from '@/hooks/useApi'
import { Loader2 } from 'lucide-react'

export function AttendanceChart() {
  const [days, setDays] = useState<7 | 30>(7)
  const { data, loading } = useApi<any>(`/api/attendance/stats?days=${days}`)

  const chartData = data?.data ?? []

  return (
    <div className="bg-card p-6 rounded-lg border shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold leading-none">Ringkasan Kehadiran</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Status kehadiran {days} hari terakhir
            {data?.total_employees ? ` • ${data.total_employees} karyawan aktif` : ''}
          </p>
        </div>

        <div className="flex bg-muted p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setDays(7)}
            className={`px-3 py-1.5 rounded-md transition-colors ${days === 7 ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setDays(30)}
            className={`px-3 py-1.5 rounded-md transition-colors ${days === 30 ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
          >
            30 Hari
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] w-full relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Tidak ada data absensi untuk periode ini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                }}
                formatter={(value, name) => {
                  const labels: Record<string, string> = {
                    hadir: 'Hadir',
                    terlambat: 'Terlambat',
                    wfh: 'WFH',
                    absent: 'Tidak Hadir',
                  }
                  return [value, labels[name ?? ''] ?? name]
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }}
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    hadir: 'Hadir',
                    terlambat: 'Terlambat',
                    wfh: 'WFH',
                    absent: 'Tidak Hadir',
                  }
                  return labels[value] ?? value
                }}
              />
              <Bar name="hadir"     dataKey="hadir"     stackId="a" fill="#22c55e" barSize={days <= 7 ? 32 : 16} />
              <Bar name="terlambat" dataKey="terlambat" stackId="a" fill="#f59e0b" barSize={days <= 7 ? 32 : 16} />
              <Bar name="wfh"       dataKey="wfh"       stackId="a" fill="#3b82f6" barSize={days <= 7 ? 32 : 16} />
              <Bar name="absent"    dataKey="absent"    stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={days <= 7 ? 32 : 16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}