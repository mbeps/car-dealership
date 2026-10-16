import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import { getLogger } from "@/lib/logger";

const log = getLogger(["app", "api", "oauth-token"]);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * OAuth 2.1 / OIDC Token Endpoint Proxy (/api/oauth/token).
 * Forwards code exchange & token refresh requests to Supabase GoTrue with CORS support
 * and telemetry diagnostics.
 */
export async function POST(req: NextRequest) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");
  const targetUrl = `${supabaseUrl}/auth/v1/oauth/token`;

  const contentType = req.headers.get("content-type") || "";
  const authHeader = req.headers.get("authorization");

  let bodyText = "";
  try {
    bodyText = await req.text();
  } catch {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "Unable to read request body",
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const forwardHeaders: Record<string, string> = {
    Accept: "application/json",
  };

  if (contentType) {
    forwardHeaders["Content-Type"] = contentType;
  } else {
    forwardHeaders["Content-Type"] = "application/x-www-form-urlencoded";
  }

  if (authHeader) {
    forwardHeaders.Authorization = authHeader;
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: "POST",
      headers: forwardHeaders,
      body: bodyText,
    });

    const responseText = await upstreamRes.text();
    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!upstreamRes.ok) {
      log.warn("OAuth token exchange upstream error: {status} {data}", {
        status: upstreamRes.status,
        data: responseData,
      });
    }

    return NextResponse.json(responseData, {
      status: upstreamRes.status,
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });
  } catch (err) {
    log.error("Failed to forward OAuth token request to Supabase: {error}", {
      error: err instanceof Error ? err.message : String(err),
    });

    return NextResponse.json(
      {
        error: "temporarily_unavailable",
        error_description: "Failed to connect to authentication server",
      },
      {
        status: 502,
        headers: CORS_HEADERS,
      },
    );
  }
}
