"use server";

import type { createClient } from "@/lib/supabase/supabase";

/**
 * Searches colors for admin car list filtering.
 * Case-insensitive partial match on color name.
 *
 * @param supabase - Supabase client instance
 * @param term - Search term
 * @returns Array of matching color IDs
 */
export async function getColorIdsForTerm(
  supabase: Awaited<ReturnType<typeof createClient>>,
  term: string,
): Promise<string[]> {
  if (!term) return [];

  const { data, error } = await supabase
    .from("CarColor")
    .select("id")
    .ilike("name", `%${term}%`);

  if (error) throw error;

  return data?.map((item) => item.id) ?? [];
}
