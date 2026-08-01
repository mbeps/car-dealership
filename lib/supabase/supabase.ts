import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { env } from "@/lib/env";

/**
 * Creates Supabase client for server-side operations.
 * Manages sessions via cookies for SSR.
 * Used in Server Components, Server Actions, Route Handlers.
 *
 * @returns Supabase client with cookie-based auth
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */
export const createClient = async () => {
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
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
 * Re-export createBrowserClient from client-only module
 */
export { createBrowserClient } from "./supabase-client";

/**
 * Creates Supabase admin client with service role.
 * Bypasses RLS policies for storage operations.
 * MUST only be used server-side - never expose to client.
 *
 * @returns Supabase client with elevated privileges
 * @see addCar - Uses this for image uploads
 * @see deleteCar - Uses this for image deletions
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
 * Does NOT use cookies or headers.
 * Safe to use inside unstable_cache or other static contexts.
 * Respects RLS for public/anon roles.
 */
export const createPublicClient = () => {
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
};
