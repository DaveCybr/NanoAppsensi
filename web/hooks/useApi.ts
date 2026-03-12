import { useState, useEffect, useCallback, useRef } from 'react'

interface UseApiOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useApi<T>(
  url: string | null,
  options?: UseApiOptions
): UseApiResult<T> {
  const [data, setData]       = useState<T | null>(null)
  const [loading, setLoading] = useState(!!url)
  const [error, setError]     = useState<string | null>(null)

  // ✅ FIX: Simpan options ke ref agar tidak jadi dependency useCallback
  // Object baru setiap render akan menyebabkan infinite re-fetch
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [url]) // ✅ hanya url sebagai dependency

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}