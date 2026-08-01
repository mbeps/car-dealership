"use server";

import { createClient } from "@/lib/supabase/supabase";
import { ROUTES } from "@/constants/routes";
import { redirect } from "next/navigation";

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