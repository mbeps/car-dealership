import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const mockWarn = vi.fn();
  const mockError = vi.fn();
  const mockInfo = vi.fn();
  return {
    mockWarn,
    mockError,
    mockInfo,
  };
});

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: h.mockWarn,
    error: h.mockError,
    info: h.mockInfo,
  },
  getLogger: () => ({
    warn: h.mockWarn,
    error: h.mockError,
    info: h.mockInfo,
  }),
}));

import {
  OPTIONS as optionsToken,
  POST as postToken,
} from "@/app/api/oauth/token/route";

describe("OAuth 2.1 Token Endpoint Proxy (/api/oauth/token)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("forwards urlencoded token exchange request to Supabase GoTrue", async () => {
    const upstreamTokenResponse = {
      access_token: "mock_access_token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "mock_refresh_token",
      id_token: "mock_id_token",
    };

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(upstreamTokenResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const bodyParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: "valid_code_123",
      redirect_uri: "https://oauth.googleusercontent.com/callback",
      client_id: "test-client-id",
      client_secret: "test-client-secret",
      code_verifier: "test-code-verifier",
    });

    const req = new Request(
      "https://car-dealership.maruf-bepary.com/api/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bodyParams.toString(),
      },
    ) as unknown as NextRequest;

    const res = await postToken(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.access_token).toBe("mock_access_token");
    expect(data.id_token).toBe("mock_id_token");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [targetUrl, options] = vi.mocked(global.fetch).mock.calls[0];
    expect(targetUrl).toContain("/auth/v1/oauth/token");
    expect(options?.method).toBe("POST");
  });

  it("supports client_secret_basic in Authorization header", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: "token_from_basic" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const basicAuth = Buffer.from("client_id_val:client_secret_val").toString(
      "base64",
    );
    const bodyParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: "code_abc",
      redirect_uri: "https://example.com/callback",
    });

    const req = new Request(
      "https://car-dealership.maruf-bepary.com/api/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: bodyParams.toString(),
      },
    ) as unknown as NextRequest;

    const res = await postToken(req);
    expect(res.status).toBe(200);

    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    const headers = options?.headers as Record<string, string>;
    expect(headers.Authorization || headers.authorization).toBe(
      `Basic ${basicAuth}`,
    );
  });

  it("logs structured warning if upstream returns error", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: 500,
          error_code: "unexpected_failure",
          msg: "Error generating ID token",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const req = new Request(
      "https://car-dealership.maruf-bepary.com/api/oauth/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=authorization_code&code=test",
      },
    ) as unknown as NextRequest;

    const res = await postToken(req);
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.msg).toBe("Error generating ID token");
    expect(h.mockWarn).toHaveBeenCalled();
  });

  it("returns 204 with CORS headers on OPTIONS", async () => {
    const res = await optionsToken();
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-methods")).toContain("POST");
  });
});
