"use server";

import { createClient } from "@/lib/supabase/supabase";
import { env } from "@/lib/env";

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

/**
 * Checks if the storage limit has been reached, optionally including
 * size of a pending upload.
 *
 * @param incomingBytes Optional bytes being added (e.g. for an upload check)
 * @returns Object containing allowance status, current usage, and limit
 */
export async function checkStorageQuota(incomingBytes: number = 0): Promise<{
  allowed: boolean;
  usageBytes: number;
  limitBytes: number;
}> {
  const usageBytes = await getStorageUsage();
  const limitBytes =
    env.NEXT_PUBLIC_TOTAL_STORAGE_LIMIT_GB * 1024 * 1024 * 1024;

  return {
    allowed: usageBytes + incomingBytes <= limitBytes,
    usageBytes,
    limitBytes,
  };
}
