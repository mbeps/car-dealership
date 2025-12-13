"use server";

import { createClient } from "@/lib/supabase";
import { ActionResponse, User } from "@/types";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { UserService } from "@/db/services";

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

    const user = await UserService.getUserByAuthId(authUser.id);
    return user?.role === "ADMIN";
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
  ActionResponse<{ role: "USER" | "ADMIN" | null }>
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

    const user = await UserService.getUserByAuthId(authUser.id);

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

    const user = await UserService.getUserByAuthId(authUser.id);

    if (!user) {
      return {
        success: false,
        error: "User profile not found",
      };
    }

    return {
      success: true,
      data: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
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
    const user = await UserService.ensureProfile(
      authUser.id,
      authUser.email!,
      authUser.user_metadata
    );

    if (!user) return null;

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
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
      redirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }${ROUTES.UPDATE_PASSWORD}`,
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
