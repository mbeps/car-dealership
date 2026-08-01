"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

type DatabaseClient = SupabaseClient;

/**
 * Resolves make slug to database ID.
 * Used for translating URL params to database filters.
 *
 * @param supabase - Supabase client instance
 * @param slug - Make slug from URL
 * @returns Make ID or null if not found
 */
export async function getMakeIdBySlug(
  supabase: DatabaseClient,
  slug: string,
): Promise<string | null> {
  if (!slug) return null;

  const { data, error } = await supabase
    .from("CarMake")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data?.id ?? null;
}
