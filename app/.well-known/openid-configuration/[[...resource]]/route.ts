import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { getSiteUrl } from "@/lib/site-url";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
};

/**
 * OpenID Connect Discovery 1.0 endpoint (/.well-known/openid-configuration).
 * Serves OpenID Provider metadata per OpenID Connect Discovery 1.0 and RFC 8414.
 *
 * @see https://openid.net/specs/openid-connect-discovery-1_0.html
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
    userinfo_endpoint: `${supabaseUrl}/auth/v1/oauth/userinfo`,
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["ES256", "RS256"],
    token_endpoint_auth_methods_supported: [
      "client_secret_post",
      "client_secret_basic",
      "none",
    ],
    scopes_supported: ["openid", "profile", "email", "phone", "offline_access"],
    claims_supported: [
      "sub",
      "aud",
      "iss",
      "exp",
      "iat",
      "auth_time",
      "nonce",
      "email",
      "email_verified",
      "phone_number",
      "phone_number_verified",
      "name",
      "picture",
      "preferred_username",
      "updated_at",
    ],
    code_challenge_methods_supported: ["S256", "plain"],
  };

  try {
    const upstreamRes = await fetch(
      `${supabaseUrl}/auth/v1/.well-known/openid-configuration`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      },
    );

    if (upstreamRes.ok) {
      const upstreamData = await upstreamRes.json();
      const scopes = Array.from(
        new Set([
          ...(Array.isArray(upstreamData.scopes_supported)
            ? upstreamData.scopes_supported
            : standardMetadata.scopes_supported),
          "offline_access",
        ]),
      );

      return NextResponse.json(
        {
          ...upstreamData,
          scopes_supported: scopes,
          registration_endpoint: `${siteUrl}/api/oauth/register`,
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
    // Upstream unreachable; return standard fallback metadata
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
