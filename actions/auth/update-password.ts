"use server";

import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";

/**
 * Updates user's password after reset flow.
 * User must be authenticated (via reset link token).
 *
 * @param password - New password
 * @returns ActionResponse indicating success or failure
 * @see https://supabase.com/docs/reference/javascript/auth-updateuser
 */
export async function updatePassword(
  password: string,
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
