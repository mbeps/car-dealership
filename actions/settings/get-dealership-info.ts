"use server";

import { getLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";
import type { DealershipInfo } from "@/types/dealership/dealership-info";

const log = getLogger(["app", "actions", "settings"]);

/**
 * Fetches dealership contact info and working hours.
 * Returns singleton record with nested hours.
 * Used for test drive forms and contact CTAs.
 *
 * @returns Dealership info with working hours or null
 * @see DealershipInfo - Singleton table
 * @see WorkingHour - Related hours table
 */
export async function getDealershipInfo(): Promise<
  ActionResponse<DealershipInfo | null>
> {
  log.debug("Fetching dealership info");
  try {
    const supabase = await createClient();

    const { data: dealership, error } = await supabase
      .from("DealershipInfo")
      .select(
        `
        *,
        workingHours:WorkingHour(*)
      `,
      )
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw error;
    }

    return {
      success: true,
      data: dealership || null,
    };
  } catch (error) {
    log.error("Error fetching dealership info: {error}", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}
