import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { MeResponse, AuthUser } from '@/types/api'

export type { AuthUser }

export type TenantInfo = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  timezone: string
  subscription_plan: string
}

export function useAuth() {
  const [user, setUser]               = useState<AuthUser | null>(null)
  const [tenant, setTenant]           = useState<TenantInfo | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading]         = useState(true)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    try {
      const res  = await fetch('/api/auth/me')
      const json = await res.json()

      if (json.success && json.data?.user) {
        // ✅ FIX: me/route.ts returns { data: { user, tenant, permissions } }
        const meData: MeResponse = json.data
        setUser(meData.user)
        setTenant(meData.tenant)
        setPermissions(meData.permissions ?? [])
      } else {
        setUser(null)
        setTenant(null)
        setPermissions([])
      }
    } catch {
      setUser(null)
      setTenant(null)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // tetap logout meski request gagal
    } finally {
      setUser(null)
      setTenant(null)
      setPermissions([])
      router.push('/login')
    }
  }

  return {
    user,
    tenant,
    permissions,
    loading,
    logout,
    refetch: checkAuth,
    isAuthenticated: !!user,
    isAdmin:      user?.role_name === 'Admin',
    isHrOrAdmin:  user?.role_name === 'Admin' || user?.role_name === 'HR Manager',
    hasPermission: (code: string) => permissions.includes(code),
  }
}