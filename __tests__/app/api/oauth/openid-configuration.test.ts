import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GET as getOpenidConfig,
  OPTIONS as optionsOpenidConfig,
} from "@/app/.well-known/openid-configuration/[[...resource]]/route";

describe("OpenID Connect Discovery 1.0 Endpoint (/.well-known/openid-configuration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("returns standard OIDC discovery metadata with CORS headers on fallback", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    const res = await getOpenidConfig();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.issuer).toContain("/auth/v1");
    expect(data.authorization_endpoint).toContain("/auth/v1/oauth/authorize");
    expect(data.token_endpoint).toContain("/auth/v1/oauth/token");
    expect(data.jwks_uri).toBeDefined();
    expect(data.registration_endpoint).toContain("/api/oauth/register");
    expect(data.scopes_supported).toContain("openid");
    expect(data.scopes_supported).toContain("offline_access");
    expect(data.response_types_supported).toContain("code");
    expect(data.id_token_signing_alg_values_supported).toContain("ES256");
    expect(data.id_token_signing_alg_values_supported).toContain("RS256");
    expect(data.claims_supported).toContain("sub");
    expect(data.claims_supported).toContain("aud");

    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("merges upstream Supabase openid-configuration when available", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          issuer: "https://mock.supabase.co/auth/v1",
          authorization_endpoint:
            "https://mock.supabase.co/auth/v1/oauth/authorize",
          token_endpoint: "https://mock.supabase.co/auth/v1/oauth/token",
          jwks_uri: "https://mock.supabase.co/auth/v1/.well-known/jwks.json",
          scopes_supported: ["openid", "profile"],
          id_token_signing_alg_values_supported: ["ES256", "RS256", "HS256"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const res = await getOpenidConfig();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.issuer).toBe("https://mock.supabase.co/auth/v1");
    expect(data.scopes_supported).toContain("openid");
    expect(data.scopes_supported).toContain("offline_access");
    expect(data.registration_endpoint).toContain("/api/oauth/register");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("handles OPTIONS request with 204 No Content and CORS headers", async () => {
    const res = await optionsOpenidConfig();
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-methods")).toContain("GET");
  });
});
