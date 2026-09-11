"use server";

import { getLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";

const log = getLogger(["app", "actions", "auth"]);

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
      log.warn("Unauthorized password update attempt: not authenticated");
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      log.error(
        "Failed to update password for user (userId: {userId}): {message}",
        {
          userId: user.id,
          message: error.message,
        },
      );
      return {
        success: false,
        error: error.message,
      };
    }

    log.info("Password updated successfully for user (userId: {userId})", {
      userId: user.id,
    });

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    log.error("Unexpected error updating password: {error}", {
      error: (error as Error).message,
    });
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
