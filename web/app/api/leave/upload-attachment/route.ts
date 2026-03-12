// app/api/leave/upload-attachment/route.ts
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { ok, badRequest, serverError } from '@/lib/utils/response'

// POST /api/leave/upload-attachment
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response
    const { user } = auth

    if (!user.employee_id) {
      return badRequest('User belum terhubung dengan data karyawan.')
    }

    const { file_base64, file_type } = await request.json()

    if (!file_base64 || !file_type) {
      return badRequest('File base64 dan tipe file diperlukan.')
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file_type)) {
      return badRequest('Tipe file tidak didukung. Gunakan JPG, PNG, atau PDF.')
    }

    // Validasi ukuran (max 5MB)
    const base64Length = file_base64.length
    if (base64Length > 6971520) {
      return badRequest('Ukuran file maksimal adalah 5MB.')
    }

    const admin = createAdminClient()
    const buffer = Buffer.from(file_base64, 'base64')
    
    // Generate filename
    const ext = file_type === 'image/jpeg' ? 'jpg' : file_type === 'application/pdf' ? 'pdf' : 'png'
    const fileName = `leave-attachments/${user.employee_id}/${crypto.randomUUID()}.${ext}`

    const { error } = await admin.storage
      .from('hr-docs')
      .upload(fileName, buffer, {
        contentType: file_type,
        upsert: true
      })

    if (error) throw error

    const { data: { publicUrl } } = admin.storage
      .from('hr-docs')
      .getPublicUrl(fileName)

    return ok({ url: publicUrl })
  } catch (error) {
    return serverError(error)
  }
}
