"use server";

import { unstable_cache } from "next/cache";
import { DEALERSHIP_NAME } from "@/config/constants";
import { BRANDING_CACHE_TAG } from "@/lib/helpers/branding-cache";
import { getLogger } from "@/lib/logger";
import { createPublicClient } from "@/lib/supabase/supabase";
import type { PublicBranding } from "@/types/dealership/public-branding";

const log = getLogger(["app", "actions", "settings"]);

/**
 * Time-to-live for branding cache in seconds (24 hours).
 */
const BRANDING_CACHE_TTL_SECONDS = 86_400;

/**
 * Fetches public branding data from the database with Next.js cache.
 * Returns default dealership name if fetch fails or no data exists.
 *
 * @returns Cached public branding data
 */
const getCachedPublicBranding = unstable_cache(
  async (): Promise<PublicBranding> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("DealershipInfo")
      .select("logoUrl, logoVersion, name")
      .single();

    if (error || !data) {
      return {
        logoUrl: null,
        logoVersion: null,
        name: DEALERSHIP_NAME,
      };
    }

    return {
      logoUrl: data.logoUrl,
      logoVersion: data.logoVersion,
      name: data.name || DEALERSHIP_NAME,
    };
  },
  ["dealership-public-branding"],
  {
    revalidate: BRANDING_CACHE_TTL_SECONDS,
    tags: [BRANDING_CACHE_TAG],
  },
);

/**
 * Retrieves public branding information for the dealership.
 * Served from server cache to prevent database hits on every page load.
 * Falls back to default branding safely if an error occurs.
 *
 * @returns Public branding information
 */
export async function getPublicBranding(): Promise<PublicBranding> {
  log.debug("Fetching public branding");
  try {
    return await getCachedPublicBranding();
  } catch (error) {
    log.error("Error fetching public branding: {error}", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      logoUrl: null,
      logoVersion: null,
      name: DEALERSHIP_NAME,
    };
  }
}
