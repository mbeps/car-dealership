"use server";

import { ensureAdminUser } from "@/lib/supabase/ensure-admin-user";
import type { ActionResponse } from "@/types/common/action-response";
import type { User } from "@/types/user/user";

/**
 * Fetches all users for admin user management.
 * Requires admin role.
 * Sorted by newest first.
 *
 * @returns All user records
 * @see User - Database user table
 */
export async function getUsers(): Promise<ActionResponse<User[]>> {
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
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}
