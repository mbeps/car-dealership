"use client";

import { useUser } from "@/hooks/use-user";

/**
 * Renders children after the current user has loaded and is authenticated.
 *
 * @param children - Content to show for signed-in users.
 * @returns null while loading or signed out; otherwise renders children.
 * @see SignedOut - Opposite signed-out guard.
 */
export function SignedIn({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return null;
  }

  return user ? children : null;
}
