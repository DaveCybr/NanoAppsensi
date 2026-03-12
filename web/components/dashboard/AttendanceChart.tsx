"use client"

import React from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts'
import { cn } from '@/lib/utils/cn'

const data = [
  { name: 'Sen', hadir: 45, terlambat: 5, absent: 2 },
  { name: 'Sel', hadir: 48, terlambat: 2, absent: 2 },
  { name: 'Rab', hadir: 42, terlambat: 8, absent: 2 },
  { name: 'Kam', hadir: 46, terlambat: 4, absent: 2 },
  { name: 'Jum', hadir: 44, terlambat: 6, absent: 2 },
  { name: 'Sab', hadir: 15, terlambat: 1, absent: 36 },
  { name: 'Min', hadir: 0, terlambat: 0, absent: 52 },
]

export function AttendanceChart() {
  return (
    <div className="bg-card p-6 rounded-lg border shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold leading-none">Ringkasan Kehadiran</h3>
          <p className="text-sm text-muted-foreground mt-1">Status kehadiran 7 hari terakhir</p>
        </div>
        
        <div className="flex bg-muted p-1 rounded-lg text-xs font-medium">
          <button className="px-3 py-1.5 bg-white rounded-md shadow-sm">7 Hari</button>
          <button className="px-3 py-1.5 hover:bg-white/50 rounded-md transition-colors">30 Hari</button>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }} 
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ 
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                fontSize: '12px'
              }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }}
            />
            <Bar 
              name="Hadir" 
              dataKey="hadir" 
              stackId="a" 
              fill="#22c55e" 
              radius={[0, 0, 0, 0]} 
              barSize={32}
            />
            <Bar 
              name="Terlambat" 
              dataKey="terlambat" 
              stackId="a" 
              fill="#f59e0b" 
              radius={[0, 0, 0, 0]} 
              barSize={32}
            />
            <Bar 
              name="Tidak Hadir" 
              dataKey="absent" 
              stackId="a" 
              fill="#ef4444" 
              radius={[4, 4, 0, 0]} 
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
