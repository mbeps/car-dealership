import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GET as getJwks,
  OPTIONS as optionsJwks,
} from "@/app/.well-known/jwks.json/route";

describe("JWKS Discovery Endpoint (/.well-known/jwks.json)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("proxies JWKS from Supabase Auth and attaches CORS headers", async () => {
    const mockJwks = {
      keys: [
        {
          kty: "EC",
          crv: "P-256",
          x: "mock-x",
          y: "mock-y",
          alg: "ES256",
          use: "sig",
          kid: "test-key-id",
        },
      ],
    };

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockJwks), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await getJwks();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.keys).toHaveLength(1);
    expect(data.keys[0].kid).toBe("test-key-id");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("returns 502 with fallback error if upstream Supabase fails", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(
      new Error("Supabase unavailable"),
    );

    const res = await getJwks();
    expect(res.status).toBe(502);

    const data = await res.json();
    expect(data.error).toBe("upstream_jwks_unavailable");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("handles OPTIONS request with 204 and CORS headers", async () => {
    const res = await optionsJwks();
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-methods")).toContain("GET");
  });
});
