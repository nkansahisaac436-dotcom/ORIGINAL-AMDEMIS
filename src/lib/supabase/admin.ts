import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Server-side only Admin Supabase Client
// Uses SUPABASE_SERVICE_ROLE_KEY. Never expose this to browser components!
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase Service Role Key or URL. Check server environment variables.');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
