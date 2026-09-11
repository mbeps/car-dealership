"use server";

import { ROUTES } from "@/constants/routes";
import { getLogger } from "@/lib/logger";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";

const log = getLogger(["app", "actions", "auth"]);

/**
 * Requests a password reset email.
 *
 * @param email - The email address of the user requesting a password reset.
 * @returns An ActionResponse indicating success or failure of the request.
 */
export async function requestPasswordReset(
  email: string,
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}${ROUTES.AUTH.UPDATE_PASSWORD}`,
    });

    if (error) {
      log.error("Failed to request password reset: {error}", {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }

    log.info("Password reset requested successfully");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    log.error("Error requesting password reset: {error}", {
      error: (error as Error).message,
    });
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
