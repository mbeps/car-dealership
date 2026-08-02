import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { createClient } from "@/lib/supabase/supabase";

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
