import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import { getLogger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/supabase";

const log = getLogger(["app", "api", "oauth-register"]);

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
 * RFC 7591 Dynamic Client Registration endpoint for MCP clients.
 * Forwards to Supabase's public DCR endpoint or falls back to the Admin OAuth API.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7591
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "Request body must be valid JSON",
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const {
    redirect_uris,
    client_name,
    client_uri,
    grant_types,
    response_types,
    scope,
    token_endpoint_auth_method,
  } = body as {
    redirect_uris?: unknown;
    client_name?: unknown;
    client_uri?: unknown;
    grant_types?: unknown;
    response_types?: unknown;
    scope?: unknown;
    token_endpoint_auth_method?: unknown;
  };

  if (
    !Array.isArray(redirect_uris) ||
    redirect_uris.length === 0 ||
    !redirect_uris.every((uri) => typeof uri === "string" && uri.length > 0)
  ) {
    return NextResponse.json(
      {
        error: "invalid_redirect_uri",
        error_description:
          "The redirect_uris parameter is required and must contain at least one valid URI.",
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const name =
    typeof client_name === "string" && client_name.trim().length > 0
      ? client_name.trim()
      : "MCP Client";

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");

  const defaultScope = "openid email profile offline_access";
  const effectiveScope =
    typeof scope === "string" && scope.trim().length > 0
      ? Array.from(
          new Set([...scope.trim().split(/\s+/), "offline_access"]),
        ).join(" ")
      : defaultScope;

  const effectiveGrantTypes =
    Array.isArray(grant_types) && grant_types.length > 0
      ? Array.from(
          new Set([...grant_types, "authorization_code", "refresh_token"]),
        )
      : ["authorization_code", "refresh_token"];

  const upstreamPayload = {
    ...body,
    scope: effectiveScope,
    grant_types: effectiveGrantTypes,
  };

  // 1. Attempt registration against Supabase's public DCR endpoint
  try {
    const upstreamRes = await fetch(
      `${supabaseUrl}/auth/v1/oauth/clients/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(upstreamPayload),
      },
    );

    if (upstreamRes.ok) {
      const data = await upstreamRes.json();
      log.info(
        "Client registered via public Supabase DCR endpoint: {clientId}",
        {
          clientId: data.client_id,
        },
      );
      return NextResponse.json(data, {
        status: 201,
        headers: {
          ...CORS_HEADERS,
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      });
    }

    log.warn(
      "Public DCR endpoint returned status {status}; falling back to admin registration API",
      { status: upstreamRes.status },
    );
  } catch (upstreamErr) {
    log.warn(
      "Public DCR endpoint fetch failed; falling back to admin API: {error}",
      {
        error:
          upstreamErr instanceof Error
            ? upstreamErr.message
            : String(upstreamErr),
      },
    );
  }

  // 2. Fall back to Supabase Admin OAuth API
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.oauth.createClient({
      client_name: name,
      client_uri: typeof client_uri === "string" ? client_uri : undefined,
      redirect_uris: redirect_uris as string[],
      grant_types: effectiveGrantTypes as [
        "authorization_code" | "refresh_token",
      ],
      response_types: Array.isArray(response_types)
        ? (response_types as ["code"])
        : ["code"],
      scope: effectiveScope,
      token_endpoint_auth_method:
        typeof token_endpoint_auth_method === "string"
          ? (token_endpoint_auth_method as
              | "none"
              | "client_secret_basic"
              | "client_secret_post")
          : undefined,
    });

    if (error || !data) {
      log.error("Failed to register OAuth client via admin API: {error}", {
        error: error?.message,
      });
      return NextResponse.json(
        {
          error: "invalid_client_metadata",
          error_description:
            error?.message || "Failed to register OAuth client",
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    log.info("Client registered via Supabase Admin OAuth API: {clientId}", {
      clientId: data.client_id,
    });

    return NextResponse.json(data, {
      status: 201,
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });
  } catch (adminErr) {
    log.error("Unexpected error in admin OAuth client registration: {error}", {
      error: adminErr instanceof Error ? adminErr.message : String(adminErr),
    });
    return NextResponse.json(
      {
        error: "server_error",
        error_description:
          "An unexpected error occurred during client registration",
      },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
