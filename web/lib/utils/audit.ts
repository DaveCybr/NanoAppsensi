// ============================================================
// lib/utils/audit.ts
// Audit log writer — dipanggil di setiap mutasi data penting
// ============================================================
import { createAdminClient } from '@/lib/supabase/server'
import { AuditAction } from '@/types/database'
import { AuthUser } from '@/types/api'

interface AuditParams {
  user: AuthUser
  action: AuditAction
  entity_type: string
  entity_id: string
  table_name?: string
  old_value?: Record<string, unknown> | null
  new_value?: Record<string, unknown> | null
  ip_address?: string
  user_agent?: string
}

export async function writeAuditLog(params: AuditParams): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      tenant_id:   params.user.tenant_id,
      user_id:     params.user.id,
      action:      params.action,
      entity_type: params.entity_type,
      entity_id:   params.entity_id,
      table_name:  params.table_name ?? params.entity_type,
      old_value:   params.old_value ?? null,
      new_value:   params.new_value ?? null,
      ip_address:  params.ip_address ?? null,
      user_agent:  params.user_agent ?? null,
    })
  } catch (err) {
    // Audit log gagal tidak boleh break flow utama — hanya log ke console
    console.error('[Audit Log Error]', err)
  }
}
