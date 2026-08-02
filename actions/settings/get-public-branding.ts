"use server";

import { DEALERSHIP_NAME } from "@/constants/dealership-name";
import { BRANDING_CACHE_TAG } from "@/lib/helpers/branding-cache";
import { createPublicClient } from "@/lib/supabase/supabase";
import type { PublicBranding } from "@/types/dealership/public-branding";
import { unstable_cache } from "next/cache";

const BRANDING_CACHE_TTL_SECONDS = 86_400;

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
