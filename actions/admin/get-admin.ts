"use server";

import { createClient } from "@/lib/supabase/supabase";
import type { AdminAuthResult } from "@/types/common/admin-auth-result";
import { UserRoleEnum as UserRole } from "@/enums/user-role";

/**
 * Verifies admin access for protected routes.
 * Called by admin layout to enforce role-based access.
 *
 * @returns Authorization result with user data if admin, or reason if denied
 * @see ROUTES.ADMIN.ADMIN - Protected admin routes
 */
export async function getAdmin(): Promise<AdminAuthResult> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !authUser) throw new Error("Unauthorized");

  const { data: user } = await supabase
    .from("User")
    .select("*")
    .eq("supabaseAuthUserId", authUser.id)
    .single();

  // If user not found in our db or not an admin, return not authorized
  if (!user || user.role !== UserRole.ADMIN) {
    return { authorized: false, reason: "not-admin" };
  }

  return { authorized: true, user };
}
