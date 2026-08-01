"use server";

import { createClient } from "@/lib/supabase/supabase";
import { ROUTES } from "@/constants/routes";
import { getSiteUrl } from "@/lib/site-url";
import type { ActionResponse } from "@/types/common/action-response";

/**
 * Requests a password reset email.
 */
export async function requestPasswordReset(
  email: string,
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}${ROUTES.UPDATE_PASSWORD}`,
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
    console.error("Error requesting password reset:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
