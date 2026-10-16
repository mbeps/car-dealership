import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const mockCreateClient = vi.fn();
  return {
    mockCreateClient,
  };
});

vi.mock("@/lib/supabase/supabase", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/supabase/supabase")>();
  return {
    ...actual,
    createAdminClient: () => ({
      auth: {
        admin: {
          oauth: {
            createClient: h.mockCreateClient,
          },
        },
      },
    }),
  };
});

import {
  GET as getAuthServerMetadata,
  OPTIONS as optionsAuthServer,
} from "@/app/.well-known/oauth-authorization-server/[[...resource]]/route";
import {
  OPTIONS as optionsRegister,
  POST as postRegister,
} from "@/app/api/oauth/register/route";

describe("OAuth 2.1 RFC 8414 Discovery & RFC 7591 Registration Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("RFC 8414 Authorization Server Metadata (GET / OPTIONS)", () => {
    it("returns standard RFC 8414 metadata with registration_endpoint guaranteed", async () => {
      // Mock upstream Supabase returning 404 (fallback path)
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "feature_disabled" }), {
          status: 404,
        }),
      );

      const res = await getAuthServerMetadata();
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.issuer).toContain("/auth/v1");
      expect(data.authorization_endpoint).toContain("/auth/v1/oauth/authorize");
      expect(data.token_endpoint).toContain("/auth/v1/oauth/token");
      expect(data.registration_endpoint).toContain("/api/oauth/register");
      expect(data.grant_types_supported).toContain("authorization_code");
      expect(data.code_challenge_methods_supported).toContain("S256");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("preserves upstream metadata and injects registration_endpoint if missing", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            issuer: "https://example.supabase.co/auth/v1",
            authorization_endpoint:
              "https://example.supabase.co/auth/v1/oauth/authorize",
            token_endpoint: "https://example.supabase.co/auth/v1/oauth/token",
            jwks_uri:
              "https://example.supabase.co/auth/v1/.well-known/jwks.json",
          }),
          { status: 200 },
        ),
      );

      const res = await getAuthServerMetadata();
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.registration_endpoint).toContain("/api/oauth/register");
    });

    it("handles OPTIONS request with CORS headers", async () => {
      const res = await optionsAuthServer();
      expect(res.status).toBe(204);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
      expect(res.headers.get("access-control-allow-methods")).toContain("GET");
    });
  });

  describe("RFC 7591 Dynamic Client Registration (POST / OPTIONS)", () => {
    it("handles OPTIONS request with CORS headers", async () => {
      const res = await optionsRegister();
      expect(res.status).toBe(204);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
      expect(res.headers.get("access-control-allow-methods")).toContain("POST");
    });

    it("rejects invalid JSON payloads with 400", async () => {
      const req = new Request("http://localhost/api/oauth/register", {
        method: "POST",
        body: "invalid-json",
      }) as NextRequest;

      const res = await postRegister(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toBe("invalid_request");
    });

    it("rejects payloads without redirect_uris with 400", async () => {
      const req = new Request("http://localhost/api/oauth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_name: "Test Client" }),
      }) as NextRequest;

      const res = await postRegister(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toBe("invalid_redirect_uri");
    });

    it("registers client via public Supabase DCR endpoint when available", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            client_id: "client-abc-123",
            client_name: "Google Gemini",
            redirect_uris: ["https://gemini.google.com/oauth/callback"],
          }),
          { status: 201 },
        ),
      );

      const req = new Request("http://localhost/api/oauth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: "Google Gemini",
          redirect_uris: ["https://gemini.google.com/oauth/callback"],
        }),
      }) as NextRequest;

      const res = await postRegister(req);
      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data.client_id).toBe("client-abc-123");
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("falls back to admin OAuth API when public DCR endpoint returns non-2xx", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "disabled" }), { status: 404 }),
      );

      h.mockCreateClient.mockResolvedValueOnce({
        data: {
          client_id: "admin-registered-client-456",
          client_name: "Claude Desktop",
          redirect_uris: ["http://localhost:8080/callback"],
          client_type: "public",
        },
        error: null,
      });

      const req = new Request("http://localhost/api/oauth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: "Claude Desktop",
          redirect_uris: ["http://localhost:8080/callback"],
        }),
      }) as NextRequest;

      const res = await postRegister(req);
      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data.client_id).toBe("admin-registered-client-456");
      expect(h.mockCreateClient).toHaveBeenCalledWith(
        expect.objectContaining({
          client_name: "Claude Desktop",
          redirect_uris: ["http://localhost:8080/callback"],
        }),
      );
    });
  });
});
