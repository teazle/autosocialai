import { createClient } from '@supabase/supabase-js';

// Note: For server-side operations in API routes, use the service role client
// The @supabase/ssr createServerClient is for pages/routes with cookies
// Since we're building API routes, we use the admin client directly

// Service role client for admin operations
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

