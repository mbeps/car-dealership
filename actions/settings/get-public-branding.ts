"use server";

import { unstable_cache } from "next/cache";
import { DEALERSHIP_NAME } from "@/constants/dealership-name";
import { BRANDING_CACHE_TAG } from "@/lib/helpers/branding-cache";
import { createPublicClient } from "@/lib/supabase/supabase";
import type { PublicBranding } from "@/types/dealership/public-branding";

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
  try {
    return await getCachedPublicBranding();
  } catch (error) {
    console.error("Error fetching public branding:", error);
    return {
      logoUrl: null,
      logoVersion: null,
      name: DEALERSHIP_NAME,
    };
  }
}
