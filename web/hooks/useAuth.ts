import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export type User = {
  id: string
  email: string
  full_name: string | null
  tenant_id: string
  role_name: string | null
  employee_id: string | null
  is_active: boolean
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me') // Assuming there is a /me endpoint or similar
        const json = await res.json()
        
        if (json.success) {
          setUser(json.data)
        } else {
          setUser(null)
          // Don't redirect here, let the layout handle it or specific pages
        }
      } catch (err) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.push('/login')
    } catch (err) {
      console.error('Logout failed', err)
    }
  }

  return { user, loading, logout, isAuthenticated: !!user }
}
