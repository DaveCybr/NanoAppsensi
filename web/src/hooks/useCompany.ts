import { useState } from 'react'
import { updateTenant, uploadLogo, updateTenantLogo, type CompanyFormData } from '../lib/companyService'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

export function useCompany() {
  const tenantId = useAuthStore(s => s.tenant?.id)
  const tenant   = useAuthStore(s => s.tenant)

  const [isSaving,    setIsSaving]    = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [saveError,   setSaveError]   = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null)

  const save = async (form: CompanyFormData) => {
    if (!tenantId) return { error: 'Tenant tidak ditemukan' }
    setIsSaving(true); setSaveError(null); setSuccessMsg(null)
    const { error } = await updateTenant(tenantId, form)
    setIsSaving(false)
    if (error) { setSaveError(error); return { error } }

    const { data } = await supabase.from('tenants').select('*').eq('id', tenantId).single()
    if (data) useAuthStore.setState({ tenant: data })

    setSuccessMsg('Data perusahaan berhasil disimpan')
    return { error: null }
  }

  const uploadLogoFile = async (file: File) => {
    if (!tenantId) return { url: null, error: 'Tenant tidak ditemukan' }
    setIsUploading(true); setUploadError(null)
    const { url, error } = await uploadLogo(tenantId, file)
    if (error) { setUploadError(error); setIsUploading(false); return { url: null, error } }

    await updateTenantLogo(tenantId, url!)
    const { data } = await supabase.from('tenants').select('*').eq('id', tenantId).single()
    if (data) useAuthStore.setState({ tenant: data })

    setIsUploading(false)
    return { url, error: null }
  }

  return { tenant, isSaving, isUploading, saveError, uploadError, successMsg, setSaveError, save, uploadLogoFile }
}
