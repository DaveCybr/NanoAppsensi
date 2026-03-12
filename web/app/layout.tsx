// ============================================================
// app/layout.tsx
// Root layout — minimal, hanya setup HTML
// ============================================================
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'HR System',
    template: '%s | HR System',
  },
  description: 'HR Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
