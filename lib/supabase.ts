import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import {
  getSupabasePublishableKey,
  getSupabaseSecretKey,
  getSupabaseUrl,
} from "./supabase-env-server";

/**
 * Creates a Supabase server client for use in Server Components, Server Actions, and Route Handlers.
 * Handles cookie-based session management for SSR.
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component without writable cookies.
        }
      },
    },
  });
};

/**
 * Re-export createBrowserClient from client-only module
 */
export { createBrowserClient } from "./supabase-client";

/**
 * Creates a Supabase admin client with elevated privileges (service role).
 * ONLY use server-side for storage operations or privileged maintenance.
 * Never expose service role to client code.
 */
export const createAdminClient = () => {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseSecretKey());
};
