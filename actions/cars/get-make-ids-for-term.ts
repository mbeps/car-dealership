"use server";

import type { createClient } from "@/lib/supabase/supabase";

/**
 * Searches makes for admin car list filtering.
 * Case-insensitive partial match on make name.
 *
 * @param supabase - Supabase client instance
 * @param term - Search term
 * @returns Array of matching make IDs
 */
export async function getMakeIdsForTerm(
  supabase: Awaited<ReturnType<typeof createClient>>,
  term: string,
): Promise<string[]> {
  if (!term) return [];

  const { data, error } = await supabase
    .from("CarMake")
    .select("id")
    .ilike("name", `%${term}%`);

  if (error) throw error;

  return data?.map((item) => item.id) ?? [];
}
