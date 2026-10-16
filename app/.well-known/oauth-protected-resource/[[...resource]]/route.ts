import {
  generateProtectedResourceMetadata,
  getPublicUrl,
  metadataCorsOptionsRequestHandler,
} from "mcp-handler";
import { env } from "@/config/env";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
};

/**
 * RFC 9728 OAuth 2.0 Protected Resource Metadata endpoint.
 * Supports both root `/.well-known/oauth-protected-resource` and path-scoped
 * queries such as `/.well-known/oauth-protected-resource/api/mcp` via optional catch-all.
 *
 * Explicitly advertises `offline_access` so Google Gemini and other strict OAuth
 * clients know to request offline tokens (refresh_token) during authorization.
 *
 * @see https://datatracker.ietf.org/doc/rfc9728/
 */
export async function GET(req: Request) {
  const publicUrl = getPublicUrl(req);
  publicUrl.pathname = publicUrl.pathname.replace(/^\/\.well-known\/[^/]+/, "");
  const resource =
    publicUrl.pathname === "/"
      ? publicUrl.toString().replace(/\/$/, "")
      : publicUrl.toString();

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");

  const metadata = generateProtectedResourceMetadata({
    authServerUrls: [`${supabaseUrl}/auth/v1`],
    resourceUrl: resource,
    additionalMetadata: {
      scopes_supported: ["openid", "email", "profile", "offline_access"],
      bearer_methods_supported: ["header"],
    },
  });

  return new Response(JSON.stringify(metadata), {
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/json",
    },
  });
}

export const OPTIONS = metadataCorsOptionsRequestHandler();
