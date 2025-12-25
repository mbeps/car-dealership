export { getSupabaseUrl, getSupabasePublishableKey } from "./supabase-env";

/**
 * Retrieves Supabase service role key from env.
 * Supports legacy SERVICE_ROLE_KEY name.
 * NEVER expose this key to client - server-only.
 *
 * @returns Supabase service role key
 * @throws Error if neither key is set
 * @see createAdminClient - Uses this key
 */
export const getSupabaseSecretKey = (): string => {
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "Missing Supabase secret key. Set SUPABASE_SECRET_KEY or legacy SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return key;
};
