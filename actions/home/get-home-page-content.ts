"use server";

import { createPublicClient } from "@/lib/supabase/supabase";
import { unstable_cache } from "next/cache";
import type { HomePageContent } from "@/types/home-content/home-page-content";

const HOME_CONTENT_TAG = "home-content";

/**
 * Fetches the singleton record containing homepage configuration data.
 * Uses Next.js unstable_cache to serve cached content across requests.
 *
 * @returns The homepage configuration object or null on failure
 */
export const getHomePageContent = unstable_cache(
  async (): Promise<HomePageContent | null> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("HomePageContent")
      .select("*")
      .single();

    if (error) {
      console.error("Error fetching home page content:", error);
      return null;
    }

    return data;
  },
  [HOME_CONTENT_TAG],
  { tags: [HOME_CONTENT_TAG] },
);
