"use server";

import { createPublicClient } from "@/lib/supabase/supabase";
import { unstable_cache } from "next/cache";
import type { FAQ } from "@/types/home-content/faq";

const FAQ_TAG = "faq";

/**
 * Fetches all FAQs ordered by 'order'.
 * Cached with unstable_cache.
 */
export const getFAQs = unstable_cache(
  async (): Promise<FAQ[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("FAQ")
      .select("*")
      .order("order", { ascending: true });

    if (error) {
      console.error("Error fetching FAQs:", error);
      return [];
    }

    return data;
  },
  [FAQ_TAG],
  { tags: [FAQ_TAG] },
);
