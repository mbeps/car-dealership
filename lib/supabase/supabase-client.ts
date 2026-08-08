import { createBrowserClient as createBrowserClientSSR } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Creates a Supabase client for authenticated client components.
 *
 * Enables browser auth features such as persisted sessions, token refresh, PKCE redirects, and passkeys.
 * Used by the auth provider to manage user sessions in the browser.
 *
 * @returns Supabase browser client with passkey support enabled.
 * @see createClient for the server-side Supabase client.
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
