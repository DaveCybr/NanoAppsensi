import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
export type CompanyFormData = {
  name: string
  phone: string | null
  email: string | null
  address: string | null
  cut_off_date: string | null
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export async function updateTenant(
  tenantId: string,
  form: CompanyFormData
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('tenants')
    .update({
      name:         form.name,
      phone:        form.phone || null,
      email:        form.email || null,
      address:      form.address || null,
      cut_off_date: form.cut_off_date || null,
    })
    .eq('id', tenantId)

  return { error: error?.message ?? null }
}

// ─── UPLOAD LOGO ──────────────────────────────────────────────────────────────
export async function uploadLogo(
  tenantId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const ext  = file.name.split('.').pop() ?? 'png'
  const path = `logos/${tenantId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { url: null, error: uploadError.message }

  const { data } = supabase.storage.from('logos').getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

// ─── UPDATE LOGO URL ──────────────────────────────────────────────────────────
export async function updateTenantLogo(
  tenantId: string,
  logoUrl: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('tenants')
    .update({ logo_url: logoUrl })
    .eq('id', tenantId)

  return { error: error?.message ?? null }
}
