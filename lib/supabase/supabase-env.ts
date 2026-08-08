import { env } from "@/lib/env";

/**
 * Retrieves the public Supabase project URL from environment variables.
 *
 * This value is safe to expose to browser code because it is not secret.
 *
 * @returns Supabase project URL.
 */
export const getSupabaseUrl = (): string => {
  return env.NEXT_PUBLIC_SUPABASE_URL;
};

/**
 * Retrieves the public Supabase anonymous or publishable key from environment variables.
 *
 * This value is safe to expose to browser code because it is not secret.
 *
 * @returns Supabase publishable key.
 */
export const getSupabasePublishableKey = (): string => {
  return env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
};
