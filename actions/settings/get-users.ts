"use server";

import { getLogger } from "@/lib/logger";
import { ensureAdminUser } from "@/lib/supabase/ensure-admin-user";
import type { ActionResponse } from "@/types/common/action-response";
import type { User } from "@/types/user/user";

const log = getLogger(["app", "actions", "settings"]);

/**
 * Fetches all users for admin user management.
 * Requires admin role.
 * Sorted by newest first.
 *
 * @returns All user records
 * @see User - Database user table
 */
export async function getUsers(): Promise<ActionResponse<User[]>> {
  log.debug("Fetching all users for admin management");
  try {
    const { supabase } = await ensureAdminUser();

    // Fetch all users
    const { data: users, error } = await supabase
      .from("User")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: users || [],
    };
  } catch (error) {
    log.error("Error fetching users: {error}", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}
