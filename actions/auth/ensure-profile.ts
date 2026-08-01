"use server";

import { createClient } from "@/lib/supabase/supabase";
import type { User } from "@/types/user/user";

/**
 * Ensures auth user has corresponding database profile.
 * Called by server Header component on every request.
 * Creates profile from OAuth metadata if missing.
 * Handles race conditions with unique constraint conflicts.
 *
 * @returns User profile or null if not authenticated
 * @see header.tsx - Server component that calls this
 * @see https://supabase.com/docs/reference/javascript/auth-getuser
 */
export async function ensureProfile(): Promise<User | null> {
  const supabase = await createClient();

  // Get authenticated user from Supabase Auth
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  try {
    // Check if profile exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is expected for new users
      console.error("Error fetching user profile:", fetchError);
      return null;
    }

    if (existingUser) {
      return existingUser as User;
    }

    // Create new profile from auth metadata
    const name =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split("@")[0] ||
      "User";

    const profilePayload = {
      id: authUser.id,
      supabaseAuthUserId: authUser.id,
      email: authUser.email!,
      name,
      imageUrl:
        authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
      phone: authUser.user_metadata?.phone,
    };

    const { data: newUser, error: createError } = await supabase
      .from("User")
      .insert(profilePayload)
      .select()
      .single();

    if (createError) {
      // 23505 = unique violation, which can happen if parallel requests insert the same user
      if (createError.code === "23505") {
        const { data: userAfterConflict } = await supabase
          .from("User")
          .select("*")
          .eq("supabaseAuthUserId", authUser.id)
          .single();

        if (userAfterConflict) {
          return userAfterConflict as User;
        }
      }

      console.error("Error creating user profile:", createError);
      return null;
    }

    return newUser as User;
  } catch (error) {
    console.error("Unexpected error in ensureProfile:", error);
    return null;
  }
}
