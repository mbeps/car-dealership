"use server";

import { getLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/supabase";

const log = getLogger(["app", "actions", "storage"]);

/**
 * Fetches the total storage usage in bytes from the database.
 * Calls the get_global_storage_usage RPC.
 *
 * @returns Total storage usage in bytes
 */
export async function getStorageUsage(): Promise<number> {
  log.debug("Fetching global storage usage via RPC");
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_global_storage_usage");

    if (error) {
      log.error("Error fetching storage usage via RPC: {message}", {
        message: error.message,
      });
      return 0;
    }

    return (data as number) || 0;
  } catch (error) {
    log.error("Unexpected error in getStorageUsage action: {error}", {
      error: (error as Error).message,
    });
    return 0;
  }
}
