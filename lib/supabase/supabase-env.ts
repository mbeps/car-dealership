/**
 * Retrieves Supabase project URL from env.
 * Throws if missing to fail fast.
 *
 * @returns Supabase URL
 * @throws Error if NEXT_PUBLIC_SUPABASE_URL not set
 */
export const getSupabaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }
  return url;
};

/**
 * Retrieves Supabase anon/publishable key from env.
 * Supports legacy ANON_KEY name for backwards compatibility.
 *
 * @returns Supabase publishable key
 * @throws Error if neither key is set
 */
export const getSupabasePublishableKey = (): string => {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      "Missing Supabase publishable key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return key;
};
