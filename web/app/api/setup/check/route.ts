import { createAdminClient } from '@/lib/supabase/server'
import { ok } from '@/lib/utils/response'

export async function GET() {
  const supabase = createAdminClient()
  
  // Check if any tenant exists
  const { count, error } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })

  if (error) {
    // If table doesn't exist or other error, assume setup is needed
    // or log it. For safety in initial setup, if we can't even check, 
    // it might be a fresh DB.
    return ok({ needs_setup: true })
  }

  return ok({ needs_setup: count === 0 })
}
