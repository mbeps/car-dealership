"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

type DatabaseClient = SupabaseClient;

/**
 * Resolves color slug to database ID.
 * Used for translating URL params to database filters.
 *
 * @param supabase - Supabase client instance
 * @param slug - Color slug from URL
 * @returns Color ID or null if not found
 */
export async function getColorIdBySlug(
  supabase: DatabaseClient,
  slug: string,
): Promise<string | null> {
  if (!slug) return null;

  const { data, error } = await supabase
    .from("CarColor")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data?.id ?? null;
}
