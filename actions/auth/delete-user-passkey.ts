"use server";

import { getLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";

const log = getLogger(["app", "actions", "auth"]);

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
      log.error(
        "Failed to delete passkey (passkeyId: {passkeyId}): {message}",
        {
          passkeyId,
          message: error.message,
        },
      );
      return {
        success: false,
        error: error.message,
      };
    }

    log.info("Passkey deleted successfully (passkeyId: {passkeyId})", {
      passkeyId,
    });

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    log.error("Error deleting passkey (passkeyId: {passkeyId}): {error}", {
      passkeyId,
      error: (error as Error).message,
    });
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
