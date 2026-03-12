import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
export type ZoneRow = {
  id: string
  tenant_id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  radius_meters: number
  created_at: string | null
  deleted_at: string | null
}

export type ZoneFormData = {
  officeName: string
  officeAddress: string
  latitude: string
  longitude: string
  radiusMeters: string
}

// ─── SELECT ───────────────────────────────────────────────────────────────────
export async function getZones(tenantId: string): Promise<{ data: ZoneRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('work_locations')
    .select('id, tenant_id, name, address, latitude, longitude, radius_meters, created_at, deleted_at')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  return { data: (data ?? []) as ZoneRow[], error: error?.message ?? null }
}

// ─── INSERT ───────────────────────────────────────────────────────────────────
export async function createZone(tenantId: string, form: ZoneFormData): Promise<{ data: ZoneRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('work_locations')
    .insert({
      tenant_id:     tenantId,
      name:          form.officeName,
      address:       form.officeAddress || null,
      latitude:      parseFloat(form.latitude),
      longitude:     parseFloat(form.longitude),
      radius_meters: parseInt(form.radiusMeters) || 200,
    })
    .select('id, tenant_id, name, address, latitude, longitude, radius_meters, created_at, deleted_at')
    .single()

  return { data: data as ZoneRow | null, error: error?.message ?? null }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export async function updateZone(id: string, form: ZoneFormData): Promise<{ data: ZoneRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('work_locations')
    .update({
      name:          form.officeName,
      address:       form.officeAddress || null,
      latitude:      parseFloat(form.latitude),
      longitude:     parseFloat(form.longitude),
      radius_meters: parseInt(form.radiusMeters) || 200,
    })
    .eq('id', id)
    .select('id, tenant_id, name, address, latitude, longitude, radius_meters, created_at, deleted_at')
    .single()

  return { data: data as ZoneRow | null, error: error?.message ?? null }
}

// ─── SOFT DELETE ──────────────────────────────────────────────────────────────
export async function deleteZone(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('work_locations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  return { error: error?.message ?? null }
}
