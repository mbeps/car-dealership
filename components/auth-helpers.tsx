"use client";

import { useUser } from "@/hooks/useUser";

/**
 * Renders children only when user is authenticated.
 * Hides during loading state.
 *
 * @param children - Content to show when signed in
 * @see SignedOut - Opposite component
 */
export function SignedIn({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return null;
  }

  return user ? <>{children}</> : null;
}

/**
 * Renders children only when user is NOT authenticated.
 * Hides during loading state.
 *
 * @param children - Content to show when signed out
 * @see SignedIn - Opposite component
 */
export function SignedOut({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return null;
  }

  return !user ? <>{children}</> : null;
}
