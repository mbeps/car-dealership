"use server";

import { getLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";
import type { User } from "@/types/user/user";

const log = getLogger(["app", "actions", "auth"]);

/**
 * Retrieves full user profile from database.
 * Joins Supabase auth user with public User table.
 *
 * @returns Complete user profile or null if not signed in
 * @see User - Database user table
 */
export async function getCurrentUser(): Promise<ActionResponse<User | null>> {
  log.debug("Fetching current user profile");
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return {
        success: true,
        data: null,
      };
    }

    const { data: user, error } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: user as User,
    };
  } catch (error) {
    log.error("Error getting current user: {error}", {
      error: (error as Error).message,
    });
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
