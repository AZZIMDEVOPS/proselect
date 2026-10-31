import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./config";

/** Cookie-less anon client for public, cacheable reads (RLS limits it to published catalogue data). */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export { isSupabaseConfigured };

