"use client";

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/supabase-client";

/**
 * Browser Supabase state available to child components.
 *
 * Tracks the authenticated client, current session, current user, and loading state managed by the provider.
 */
type SupabaseContextType = {
  // biome-ignore lint/suspicious/noExplicitAny: Generic Supabase database schema type fallback
  supabaseClient: SupabaseClient<any, "public", any>;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
};

/**
 * Stores the browser Supabase provider state for the component tree.
 */
const SupabaseContext = createContext<SupabaseContextType | undefined>(
  undefined,
);

/**
 * Provider props for SupabaseProvider.
 *
 * @param children - Child components that consume Supabase session state.
 */
interface SupabaseProviderProps {
  children: React.ReactNode;
}

/**
 * Provides authenticated Supabase client state to client components.
 *
 * Creates the browser client once, loads the current session and user, subscribes to auth state changes, and refreshes the Next.js router when auth changes.
 *
 * @param children - Child components that consume Supabase context.
 * @returns Provider element for the application shell.
 */
const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [supabaseClient] = useState(() => createBrowserClient());
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const syncSession = async () => {
      setIsLoading(true);

      try {
        const [
          {
            data: { session },
          },
          {
            data: { user },
          },
        ] = await Promise.all([
          supabaseClient.auth.getSession(),
          supabaseClient.auth.getUser(),
        ]);

        if (!mounted) return;

        setSession(session);
        setUser(user);
      } catch (error) {
        console.error("Failed to fetch Supabase session:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    syncSession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      router.refresh();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabaseClient, router]);

  const value = useMemo(
    () => ({
      supabaseClient,
      session,
      user,
      isLoading,
    }),
    [supabaseClient, session, user, isLoading],
  );

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export default SupabaseProvider;

/**
 * Reads the Supabase context and fails fast if the provider is missing.
 *
 * Use this helper before creating provider-specific hooks so callers get a clear error when the provider is not mounted.
 *
 * @returns Supabase context state.
 * @throws {Error} When SupabaseProvider is not present in the component tree.
 */
const useSupabaseContext = () => {
  const context = useContext(SupabaseContext);

  if (!context) {
    throw new Error(
      "Supabase hooks can only be used inside a SupabaseProvider component.",
    );
  }

  return context;
};

/**
 * Returns the current Supabase provider state.
 *
 * Use this when a component needs the session, user, client, or loading state together.
 *
 * @returns Supabase context state.
 */
export const useSessionContext = () => useSupabaseContext();

/**
 * Returns the authenticated browser Supabase client.
 *
 * Use this for client-side Supabase operations that should use the configured PKCE/passkey browser client.
 *
 * @returns Supabase client.
 */
export const useSupabaseClient = () => useSupabaseContext().supabaseClient;

/**
 * Returns the currently authenticated user.
 *
 * Returns null when no user is present in the Supabase auth session.
 *
 * @returns Current Supabase user, or null.
 */
export const useSupabaseUser = () => useSupabaseContext().user;
