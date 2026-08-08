import { env } from "@/lib/env";
export { getSupabaseUrl, getSupabasePublishableKey } from "./supabase-env";

/**
 * Exposes server-only Supabase environment helpers.
 *
 * Re-exports public URL and key getters while keeping the service role key server-only. Never import this module in client code.
 *
 * @returns Supabase service role key.
 * @see getSupabaseUrl for the public project URL.
 * @see getSupabasePublishableKey for the public publishable key.
 */
export const getSupabaseSecretKey = (): string => {
  return env.SUPABASE_SECRET_KEY;
};
