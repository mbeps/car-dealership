import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { createClient } from "@/lib/supabase/supabase";

/**
 * Ensures the current authenticated user is an admin and returns a usable Supabase client.
 *
 * Reads the SSR auth session, looks up the app user row, and rejects non-admin users before returning credentials for admin-only operations.
 *
 * @returns Supabase client and admin user id for the authenticated session.
 * @throws {Error} When no auth session exists or the session does not belong to an admin user.
 */
export async function ensureAdminUser(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
}> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    throw new Error("Unauthorized");
  }

  const { data: user } = await supabase
    .from("User")
    .select("id, role")
    .eq("supabaseAuthUserId", authUser.id)
    .single();

  if (!user || user.role !== UserRole.ADMIN) {
    throw new Error("Unauthorized access");
  }

  return { supabase, userId: user.id };
}
