import { createBrowserClient as createBrowserClientSSR } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Creates a Supabase client for client components.
 * Enables browser auth features such as session refresh and passkeys.
 *
 * @returns Supabase browser client with passkey support enabled
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
