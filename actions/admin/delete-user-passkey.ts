"use server";

import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";

/**
 * Deletes a registered passkey by identifier.
 *
 * @param passkeyId - The passkey identifier to remove
 * @returns Action response indicating success or failure
 */
export async function deleteUserPasskey(
  passkeyId: string,
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.passkey.delete({ passkeyId });

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
    console.error("Error deleting passkey:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}