"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

type DatabaseClient = SupabaseClient;

/**
 * Searches makes by name for search queries.
 * Enables searching cars by make name.
 *
 * @param supabase - Supabase client instance
 * @param search - Search term
 * @returns Array of matching make IDs
 */
export async function getMakeIdsForSearch(
  supabase: DatabaseClient,
  search: string,
): Promise<string[]> {
  if (!search) return [];

  const { data, error } = await supabase
    .from("CarMake")
    .select("id")
    .ilike("name", `%${search}%`);

  if (error) {
    throw error;
  }

  return data?.map((item) => item.id) ?? [];
}
