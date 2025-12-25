"use client";

import { useEffect, useState } from "react";
import { getCurrentUserRole } from "@/actions/auth";
import { useAuth } from "@/lib/auth-context";
import { UserRoleEnum as UserRole } from "@/enums/user-role";

/**
 * Hook to fetch and track user role.
 * Refetches when auth state changes.
 * Used for conditional admin UI rendering.
 *
 * @returns Role (USER/ADMIN/null), loading, and boolean helpers
 * @see getCurrentUserRole - Server action fetching role
 * @see useAuth - Auth context this depends on
 */
export function useUserRole() {
  const { user, isSignedIn } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!isSignedIn) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const result = await getCurrentUserRole();
        if (result.success) {
          setRole(result.data.role);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [isSignedIn, user]);

  return {
    role,
    isAdmin: role === UserRole.ADMIN,
    isUser: role === UserRole.USER,
    loading,
  };
}
