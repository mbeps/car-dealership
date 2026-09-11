"use server";

import { getLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";

const log = getLogger(["app", "actions", "auth"]);

/**
 * Lists the authenticated user's registered passkeys.
 *
 * @returns Action response containing passkey data or an error message
 */
export async function listUserPasskeys(): Promise<ActionResponse<unknown[]>> {
  log.debug("Listing user passkeys");
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.passkey.list();

    if (error) {
      log.error("Failed to list passkeys: {message}", {
        message: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data ?? [],
    };
  } catch (error) {
    log.error("Error listing passkeys: {error}", {
      error: (error as Error).message,
    });
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
