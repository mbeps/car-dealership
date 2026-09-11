"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { getLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/supabase";

const log = getLogger(["app", "actions", "auth"]);

/**
 * Signs out user and redirects to home.
 * Called by AuthProvider's signOut method.
 *
 * @see AuthProvider.signOut - Client wrapper that calls this
 * @see https://supabase.com/docs/reference/javascript/auth-signout
 */
export async function signOut(): Promise<void> {
  log.info("User signing out");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.HOME.HOME);
}
