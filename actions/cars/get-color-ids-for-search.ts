"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

type DatabaseClient = SupabaseClient;

/**
 * Searches colors by name for search queries.
 * Enables searching cars by color name.
 *
 * @param supabase - Supabase client instance
 * @param search - Search term
 * @returns Array of matching color IDs
 */
export async function getColorIdsForSearch(
  supabase: DatabaseClient,
  search: string,
): Promise<string[]> {
  if (!search) return [];

  const { data, error } = await supabase
    .from("CarColor")
    .select("id")
    .ilike("name", `%${search}%`);

  if (error) {
    throw error;
  }

  return data?.map((item) => item.id) ?? [];
}
