import { createBrowserClient as createBrowserClientSSR } from "@supabase/ssr";

import { getSupabasePublishableKey, getSupabaseUrl } from "./supabase-env";

/**
 * Creates Supabase client for Client Components.
 * Manages auth state and session refresh in browser.
 *
 * @returns Supabase browser client
 * @see AuthProvider - Initializes this on mount
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */
export const createBrowserClient = () => {
  return createBrowserClientSSR(getSupabaseUrl(), getSupabasePublishableKey());
};
