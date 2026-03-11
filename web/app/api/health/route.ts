// ============================================================
// app/api/health/route.ts
// GET /api/health
// Health check — untuk monitoring VPS, uptime checker, Docker
// ============================================================
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ok, serverError } from '@/lib/utils/response'

export async function GET(_request: NextRequest) {
  try {
    const start = Date.now()

    // Cek koneksi database
    const admin = createAdminClient()
    const { error } = await admin
      .from('tenants')
      .select('id')
      .limit(1)
      .single()

    const dbLatency = Date.now() - start
    const dbStatus = error && error.code !== 'PGRST116'
      ? 'error'   // PGRST116 = no rows, yang artinya koneksi OK
      : 'ok'

    return ok({
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.1.0',
      services: {
        database: {
          status: dbStatus,
          latency_ms: dbLatency,
        },
        api: {
          status: 'ok',
        },
      },
    })
  } catch (error) {
    return serverError(error)
  }
}
