import { NextResponse } from "next/server";
import { env } from "@/config/env";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
};

/**
 * JWKS endpoint proxy (/.well-known/jwks.json).
 * Proxies cryptographic keys from Supabase Auth to enable local JWT verification
 * for clients that query the app host domain directly.
 */
export async function GET() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");

  try {
    const upstreamRes = await fetch(
      `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 600 },
      },
    );

    if (upstreamRes.ok) {
      const data = await upstreamRes.json();
      return NextResponse.json(data, {
        headers: {
          ...CORS_HEADERS,
          "Cache-Control": "public, max-age=600",
        },
      });
    }

    return NextResponse.json(
      { error: "upstream_jwks_unavailable", status: upstreamRes.status },
      {
        status: 502,
        headers: CORS_HEADERS,
      },
    );
  } catch {
    return NextResponse.json(
      { error: "upstream_jwks_unavailable" },
      {
        status: 502,
        headers: CORS_HEADERS,
      },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
