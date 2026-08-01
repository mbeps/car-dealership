import { createBrowserClient as createBrowserClientSSR } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Creates Supabase client for Client Components.
 * Manages auth state and session refresh in browser.
 *
 * @returns Supabase browser client
 * @see AuthProvider - Initializes this on mount
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */
export const createBrowserClient = () => {
  return createBrowserClientSSR(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        experimental: {
          passkey: true,
        },
      },
    },
  );
};
