import { AsyncLocalStorage } from "node:async_hooks";
import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { env } from "@/config/env";

const mcpSupabaseStorage = new AsyncLocalStorage<SupabaseClient>();

/**
 * Executes a function within the context of a bound SupabaseClient.
 * Used during MCP request handling to ensure downstream Server Actions
 * consume the caller's authenticated or guest Supabase instance.
 */
export function runWithMcpSupabase<T>(
  client: SupabaseClient,
  fn: () => Promise<T>,
): Promise<T> {
  return mcpSupabaseStorage.run(client, fn);
}

/**
 * Creates a stateless Supabase client scoped to an explicit Bearer JWT token.
 * Passes the Authorization header so PostgREST RLS and auth.getUser evaluate the token.
 */
export const createTokenClient = (accessToken: string) => {
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
};

/**
 * Creates a Supabase client for server components and server actions.
 *
 * Uses Next.js cookies to preserve SSR sessions, refresh tokens, PKCE flows, and passkey support. Cookie writes are best-effort because some Server Components do not allow mutable cookies.
 *
 * @returns Supabase client with cookie-based auth and passkey support.
 * @see createPublicClient for stateless RLS-aware reads.
 */
export const createClient = async () => {
  const mcpClient = mcpSupabaseStorage.getStore();
  if (mcpClient) return mcpClient;

  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options: CookieOptions;
          }>,
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component without writable cookies.
          }
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
        experimental: {
          passkey: true,
        },
      },
    },
  );
};

/**
 * Re-exports the browser Supabase client for client-side code.
 */
export { createBrowserClient } from "@/lib/supabase/supabase-client";

/**
 * Creates a Supabase admin client with the service role key.
 *
 * Bypasses RLS policies for trusted server-side operations such as storage management. Never expose this client or the service role key to client code.
 *
 * @returns Supabase client with elevated privileges.
 * @see addCar for storage writes that use this client.
 * @see https://supabase.com/docs/guides/api/rest/authentication#the-service_role-key
 */
export const createAdminClient = () => {
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
  );
};

/**
 * Creates a stateless Supabase client with the anonymous key.
 *
 * Does not use cookies or headers, so it is safe for unstable_cache, static rendering, and public reads where RLS should apply.
 *
 * @returns Supabase client scoped to public/anon privileges.
 */
export const createPublicClient = () => {
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
};
