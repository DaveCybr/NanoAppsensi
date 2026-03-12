import { useState, useEffect, useCallback } from 'react'

export function useApi<T>(url: string | null, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!url)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!url) return
    
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(url, options)
      const json = await res.json()
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Error ${res.status}: ${res.statusText}`)
      }
      
      setData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }, [url, options])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
