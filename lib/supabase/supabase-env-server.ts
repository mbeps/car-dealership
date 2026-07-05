import { env } from "@/lib/env";
export { getSupabaseUrl, getSupabasePublishableKey } from "./supabase-env";

/**
 * Retrieves Supabase service role key from env.
 * NEVER expose this key to client - server-only.
 *
 * @returns Supabase service role key
 * @see createAdminClient - Uses this key
 */
export const getSupabaseSecretKey = (): string => {
  return env.SUPABASE_SECRET_KEY;
};
