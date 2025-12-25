"use server";

import { createClient } from "@/lib/supabase";
import type { ActionResponse } from "@/types/common/action-response";
import type { User } from "@/types/user/user";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getSiteUrl } from "@/lib/utils";

/**
 * Quick admin role check for conditional rendering.
 * Used by client components via useUserRole hook.
 *
 * @returns True if user is admin, false otherwise
 * @see useUserRole - Client hook that calls this
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return false;

    const { data: user } = await supabase
      .from("User")
      .select("role")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    return user?.role === UserRole.ADMIN;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Fetches user role from database.
 * Returns null if not authenticated.
 *
 * @returns ActionResponse with user role or null
 * @see User.role - Database enum for roles
 */
export async function getCurrentUserRole(): Promise<
  ActionResponse<{ role: UserRole | null }>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return {
        success: true,
        data: { role: null },
      };
    }

    const { data: user } = await supabase
      .from("User")
      .select("role")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    return {
      success: true,
      data: { role: user?.role || null },
    };
  } catch (error) {
    console.error("Error getting user role:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Retrieves full user profile from database.
 * Joins Supabase auth user with public User table.
 *
 * @returns Complete user profile or null if not signed in
 * @see User - Database user table
 */
export async function getCurrentUser(): Promise<ActionResponse<User | null>> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return {
        success: true,
        data: null,
      };
    }

    const { data: user, error } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: user as User,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

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

/**
 * Signs out user and redirects to home.
 * Called by AuthProvider's signOut method.
 *
 * @see AuthProvider.signOut - Client wrapper that calls this
 * @see https://supabase.com/docs/reference/javascript/auth-signout
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.HOME);
}

/**
 * Sends password reset email to user.
 * Email contains link to update-password page with token.
 *
 * @param email - User's email address
 * @returns ActionResponse indicating success or failure
 * @see https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
 */
export async function requestPasswordReset(
  email: string
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}${ROUTES.UPDATE_PASSWORD}`,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Updates user's password after reset flow.
 * User must be authenticated (via reset link token).
 *
 * @param password - New password
 * @returns ActionResponse indicating success or failure
 * @see https://supabase.com/docs/reference/javascript/auth-updateuser
 */
export async function updatePassword(
  password: string
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
