"use server";

import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { getLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/supabase";

const log = getLogger(["app", "actions", "auth"]);

/**
 * Quick admin role check for conditional rendering.
 * Used by client components via useUserRole hook.
 *
 * @returns True if user is admin, false otherwise
 * @see useUserRole - Client hook that calls this
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  log.debug("Checking if current user is admin");
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return false;

    const { data: user } = await supabase
      .from("User")
      .select("role")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    return user?.role === UserRole.ADMIN;
  } catch (error) {
    log.error("Error checking admin status: {error}", {
      error: (error as Error).message,
    });
    return false;
  }
}
