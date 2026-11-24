import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The service-role client. Server only.
 *
 * This key bypasses row level security entirely — it is the one credential
 * that can read every buyer's name, email and phone. It must never be
 * prefixed `NEXT_PUBLIC_`, never imported into a client component, and never
 * logged.
 *
 * `orders` has RLS on and no policy, which is what makes the anon key
 * useless against it. That arrangement only holds while this client is the
 * only thing that touches the table.
 */
let cached: SupabaseClient | null = null;

export function serviceClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // Loud rather than a client that fails later with a confusing 401. The
    // checkout gate should have stopped the request before here.
    throw new Error(
      "Supabase is not configured: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are both required",
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
