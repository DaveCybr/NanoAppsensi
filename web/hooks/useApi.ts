import { useState, useEffect, useCallback, useRef } from 'react'
import { PaginationMeta } from '@/types/api'

interface UseApiOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

interface UseApiResult<T> {
  data: T | null
  meta: PaginationMeta | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useApi<T>(
  url: string | null,
  options?: UseApiOptions
): UseApiResult<T> {
  const [data, setData]       = useState<T | null>(null)
  const [meta, setMeta]       = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(!!url)
  const [error, setError]     = useState<string | null>(null)

  // ✅ FIX: Simpan options ke ref agar tidak jadi dependency useCallback
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })

  const fetchData = useCallback(async () => {
    if (!url) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const opts = optionsRef.current
      const res  = await fetch(url, {
        method:  opts?.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(opts?.headers ?? {}),
        },
        body: opts?.body ? JSON.stringify(opts.body) : undefined,
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || `Error ${res.status}`)
      }

      setData(json.data)
      setMeta(json.meta || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem')
      setData(null)
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, meta, loading, error, refetch: fetchData }
}