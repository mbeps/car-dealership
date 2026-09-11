"use server";

import type { UserRoleEnum as UserRole } from "@/enums/user-role";
import { getLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";

const log = getLogger(["app", "actions", "auth"]);

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
  log.debug("Fetching current user role");
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
    log.error("Error getting user role: {error}", {
      error: (error as Error).message,
    });
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
