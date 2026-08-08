"use server";

import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";

/**
 * Lists the authenticated user's registered passkeys.
 *
 * @returns Action response containing passkey data or an error message
 */
export async function listUserPasskeys(): Promise<ActionResponse<unknown[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.passkey.list();

    if (error) {
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
    console.error("Error listing passkeys:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
