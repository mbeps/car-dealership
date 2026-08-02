"use server";

import { env } from "@/lib/env";
import { getStorageUsage } from "./get-storage-usage";

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
