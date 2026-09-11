"use server";

import { unstable_cache } from "next/cache";
import { getLogger } from "@/lib/logger";
import { createPublicClient } from "@/lib/supabase/supabase";
import type { FAQ } from "@/types/home-content/faq";

const log = getLogger(["app", "actions", "home"]);

const FAQ_TAG = "faq";

/**
 * Retrieves all FAQ entries, ordered by user-defined sequence.
 * Uses Next.js unstable_cache to serve cached data efficiently.
 *
 * @returns A list of FAQs or an empty array on failure
 */
export const getFAQs = unstable_cache(
  async (): Promise<FAQ[]> => {
    log.debug("Fetching FAQs");
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("FAQ")
      .select("*")
      .order("order", { ascending: true });

    if (error) {
      log.error("Error fetching FAQs: {message}", { message: error.message });
      return [];
    }

    return data;
  },
  [FAQ_TAG],
  { tags: [FAQ_TAG] },
);
