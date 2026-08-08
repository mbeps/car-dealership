"use server";

import type {
  SupabaseClient,
  User as SupabaseAuthUser,
} from "@supabase/supabase-js";
import type { User as DbUser } from "@/types/user/user";

type DatabaseClient = SupabaseClient;

/**
 * Ensures auth user has database profile.
 * Similar to ensureProfile but for action context.
 * Creates profile from OAuth metadata if needed.
 *
 * @param supabase - Supabase client instance
 * @param authUser - Authenticated Supabase user
 * @returns Database user record
 * @throws Error if profile creation fails
 */
export async function getOrCreateDbUser(
  supabase: DatabaseClient,
  authUser: SupabaseAuthUser,
): Promise<DbUser> {
  const { data: user, error } = await supabase
    .from("User")
    .select("*")
    .eq("supabaseAuthUserId", authUser.id)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (user) {
    return user as DbUser;
  }

  const name =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split("@")[0] ||
    "User";

  const profilePayload = {
    id: authUser.id,
    supabaseAuthUserId: authUser.id,
    email: authUser.email || "",
    name,
    imageUrl:
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      null,
    phone: authUser.user_metadata?.phone || null,
  };

  const { data: newUser, error: createError } = await supabase
    .from("User")
    .insert(profilePayload)
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  return newUser as DbUser;
}
