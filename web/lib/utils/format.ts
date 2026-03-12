/**
 * Utilitas untuk formatting data (Tanggal, Mata Uang, Durasi)
 * Menggunakan locale id-ID (Bahasa Indonesia)
 */

export const formatDate = (date: string | Date | null | undefined, format: 'full' | 'short' | 'monthYear' = 'full') => {
  if (!date) return '-'
  const d = new Date(date)
  
  if (format === 'monthYear') {
    return new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric'
    }).format(d)
  }

  if (format === 'short') {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d)
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d)
}

export const formatTime = (time: string | null | undefined) => {
  if (!time) return '-'
  // Handle HH:mm:ss or HH:mm
  const parts = time.split(':')
  if (parts.length < 2) return time
  return `${parts[0]}:${parts[1]} WIB`
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}j`
  return `${hours}j ${mins}m`
}

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('id-ID').format(num)
}
