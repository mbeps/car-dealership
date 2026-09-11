"use client";

import { useUser } from "@/hooks/use-user";

/**
 * Renders children after the current user has loaded and is signed out.
 *
 * @param children - Content to show for signed-out users.
 * @returns null while loading or signed in; otherwise renders children.
 * @see SignedIn - Opposite signed-in guard.
 */
export function SignedOut({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return null;
  }

  return !user ? children : null;
}
