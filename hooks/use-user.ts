"use client";

import { useContext } from "react";
import { UserContext } from "@/providers/user-provider";

/**
 * Returns the user context value.
 * Throws when used outside of UserProvider.
 *
 * @returns Access token, Supabase user, user details, and loading state
 */
export default function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider.");
  }
  return context;
}

export { useUser };
