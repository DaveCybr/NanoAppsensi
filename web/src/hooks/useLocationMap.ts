import { useState, useEffect, useCallback, useRef } from 'react'
import { getLiveLocations, type LiveLocationRow, type LocationMapSummary } from '../lib/locationMapService'
import { ensureValidSession } from '../lib/sessionGuard'
import { useAuthStore } from '../stores/authStore'

function todayStr() { return new Date().toISOString().slice(0, 10) }

export function useLocationMap() {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const [date, setDate] = useState(todayStr())
  const [rows, setRows] = useState<LiveLocationRow[]>([])
  const [summary, setSummary] = useState<LocationMapSummary>({ onTime: 0, absent: 0, late: 0, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async (d: string) => {
    if (!tenantId) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller
    setIsLoading(true); setError(null)
    try {
      const valid = await ensureValidSession()
      if (signal.aborted) return
      if (!valid) { setError('Sesi berakhir. Silakan refresh halaman.'); return }
      const { data, summary, error } = await getLiveLocations(tenantId, d)
      if (signal.aborted) return
      if (error) setError(error)
      else { setRows(data); setSummary(summary) }
    } finally {
      if (!signal.aborted) setIsLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    load(date)
    return () => { abortRef.current?.abort() }
  }, [date, load])

  // Auto-refresh setiap 2 menit, skip jika tab tidak visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') load(date)
    }, 120_000)
    return () => clearInterval(interval)
  }, [date, load])

  return { date, setDate, rows, summary, isLoading, error,
    refetch: useCallback(() => load(date), [load, date]) }
}
