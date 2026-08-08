"use server";

import { createClient } from "@/lib/supabase/supabase";

/**
 * Fetches the total storage usage in bytes from the database.
 * Calls the get_global_storage_usage RPC.
 *
 * @returns Total storage usage in bytes
 */
export async function getStorageUsage(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_global_storage_usage");

    if (error) {
      console.error("Error fetching storage usage via RPC:", error);
      return 0;
    }

    return (data as number) || 0;
  } catch (error) {
    console.error("Unexpected error in getStorageUsage action:", error);
    return 0;
  }
}
