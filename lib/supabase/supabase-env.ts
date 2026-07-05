import { env } from "@/lib/env";

/**
 * Retrieves Supabase project URL from env.
 *
 * @returns Supabase URL
 */
export const getSupabaseUrl = (): string => {
  return env.NEXT_PUBLIC_SUPABASE_URL;
};

/**
 * Retrieves Supabase anon/publishable key from env.
 *
 * @returns Supabase publishable key
 */
export const getSupabasePublishableKey = (): string => {
  return env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
};
