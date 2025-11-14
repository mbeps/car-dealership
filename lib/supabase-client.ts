import { createBrowserClient as createBrowserClientSSR } from "@supabase/ssr";

const getSupabaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }
  return url;
};

const getSupabaseAnonKey = (): string => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.");
  }
  return key;
};

/**
 * Creates a Supabase browser client for use in Client Components.
 * Automatically manages auth state and session refresh.
 */
export const createBrowserClient = () => {
  return createBrowserClientSSR(getSupabaseUrl(), getSupabaseAnonKey());
};
