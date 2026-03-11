import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ok, serverError } from '@/lib/utils/response'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[Logout Error]', error)
    }

    return ok(null, 'Logout berhasil.')
  } catch (error) {
    return serverError(error)
  }
}
