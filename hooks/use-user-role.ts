"use client";

import { useEffect, useState } from "react";
import { getCurrentUserRole } from "@/actions/auth";
import { useAuth } from "@/lib/auth-context";

/**
 * Hook to check if the current user is an admin
 */
export function useUserRole() {
  const { user, isSignedIn } = useAuth();
  const [role, setRole] = useState<"USER" | "ADMIN" | null>(null);
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
    isAdmin: role === "ADMIN",
    isUser: role === "USER",
    loading,
  };
}
