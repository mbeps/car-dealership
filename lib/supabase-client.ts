import { createBrowserClient as createBrowserClientSSR } from "@supabase/ssr";

import { getSupabasePublishableKey, getSupabaseUrl } from "./supabase-env";

/**
 * Creates a Supabase browser client for use in Client Components.
 * Automatically manages auth state and session refresh.
 */
export const createBrowserClient = () => {
  return createBrowserClientSSR(
    getSupabaseUrl(),
    getSupabasePublishableKey()
  );
};
