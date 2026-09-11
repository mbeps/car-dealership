import { NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/supabase";

const log = getLogger(["app", "api", "auth-callback"]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirect = requestUrl.searchParams.get("redirect") || "/";

  log.debug("Processing auth callback request for redirect to '{redirect}'", {
    redirect,
  });

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        log.error("Failed to exchange code for session: {error}", {
          error: error.message,
        });
      } else {
        log.info("Successfully exchanged auth code for session");
      }
    } catch (err) {
      log.error("Unexpected error in auth callback: {error}", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Redirect to the specified path or home
  return NextResponse.redirect(new URL(redirect, requestUrl.origin));
}
