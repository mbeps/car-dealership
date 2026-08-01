"use server";

import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";
import { UserRoleEnum as UserRole } from "@/enums/user-role";

/**
 * Fetches user role from database.
 * Returns null if not authenticated.
 *
 * @returns ActionResponse with user role or null
 * @see User.role - Database enum for roles
 */
export async function getCurrentUserRole(): Promise<
  ActionResponse<{ role: UserRole | null }>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return {
        success: true,
        data: { role: null },
      };
    }

    const { data: user } = await supabase
      .from("User")
      .select("role")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    return {
      success: true,
      data: { role: user?.role || null },
    };
  } catch (error) {
    console.error("Error getting user role:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
