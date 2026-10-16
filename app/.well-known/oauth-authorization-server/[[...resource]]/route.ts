import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { getSiteUrl } from "@/lib/site-url";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
};

/**
 * RFC 8414 OAuth 2.0 Authorization Server Metadata endpoint.
 * Serves metadata for MCP clients that probe the MCP host directly for OAuth 2.1 discovery.
 * Ensures registration_endpoint (RFC 7591) is always present.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc8414
 */
export async function GET() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");
  const siteUrl = getSiteUrl();

  const standardMetadata = {
    issuer: `${supabaseUrl}/auth/v1`,
    authorization_endpoint: `${supabaseUrl}/auth/v1/oauth/authorize`,
    token_endpoint: `${supabaseUrl}/auth/v1/oauth/token`,
    registration_endpoint: `${siteUrl}/api/oauth/register`,
    jwks_uri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256", "plain"],
    token_endpoint_auth_methods_supported: [
      "none",
      "client_secret_post",
      "client_secret_basic",
    ],
    scopes_supported: ["openid", "email", "profile"],
  };

  try {
    const upstreamRes = await fetch(
      `${supabaseUrl}/auth/v1/.well-known/oauth-authorization-server`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      },
    );

    if (upstreamRes.ok) {
      const upstreamData = await upstreamRes.json();
      return NextResponse.json(
        {
          ...upstreamData,
          registration_endpoint:
            upstreamData.registration_endpoint ||
            standardMetadata.registration_endpoint,
        },
        {
          headers: {
            ...CORS_HEADERS,
            "Cache-Control": "public, max-age=3600",
          },
        },
      );
    }
  } catch {
    // Upstream unreachable or disabled; return standard fallback metadata
  }

  return NextResponse.json(standardMetadata, {
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
