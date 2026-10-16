import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const mockAuthUser = { id: "auth-123", email: "user@example.com" };
  const mockDbUser = { id: "user-456", role: "USER" };
  const getUserMock = vi.fn();
  const getOrCreateDbUserMock = vi.fn();

  return {
    mockAuthUser,
    mockDbUser,
    getUserMock,
    getOrCreateDbUserMock,
  };
});

vi.mock("@/actions/cars/get-or-create-db-user", () => ({
  getOrCreateDbUser: (...args: unknown[]) => h.getOrCreateDbUserMock(...args),
}));

vi.mock("@/lib/supabase/supabase", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/supabase/supabase")>();
  return {
    ...actual,
    createTokenClient: (token: string) => {
      if (token === "bad-token") {
        return {
          auth: {
            getUser: async () => ({
              data: { user: null },
              error: { message: "Invalid JWT" },
            }),
          },
        };
      }
      return {
        auth: {
          getUser: async () => ({
            data: { user: h.mockAuthUser },
            error: null,
          }),
        },
      };
    },
  };
});

import { GET as getProtectedResourceMetadata } from "@/app/.well-known/oauth-protected-resource/route";
import { POST } from "@/app/api/mcp/route";

function parseMcpResponse(text: string) {
  for (const line of text.split("\n")) {
    if (line.startsWith("data:")) {
      return JSON.parse(line.slice(5).trim());
    }
  }
  return JSON.parse(text);
}

describe("MCP Route Handlers: /api/mcp & /.well-known/oauth-protected-resource", () => {
  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    h.getOrCreateDbUserMock.mockResolvedValue(h.mockDbUser);
  });

  describe("Streamable HTTP Handshake & Header Validation", () => {
    it("handles initialize handshake with 200 and server capabilities", async () => {
      const request = new Request("http://localhost:3000/api/mcp", {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "test-client", version: "1.0.0" },
          },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = parseMcpResponse(await response.text());
      expect(data.result.serverInfo.name).toBe("ai-car-marketplace");
      expect(data.result.capabilities.tools).toBeDefined();
    });

    it("rejects request missing text/event-stream accept header with 406 Not Acceptable", async () => {
      const request = new Request("http://localhost:3000/api/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "test-client", version: "1.0.0" },
          },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(406);
    });

    it("returns 401 with WWW-Authenticate header when invalid bearer token is provided", async () => {
      const request = new Request("http://localhost:3000/api/mcp", {
        method: "POST",
        headers: {
          ...defaultHeaders,
          Authorization: "Bearer bad-token",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/list",
          params: {},
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
      expect(response.headers.get("WWW-Authenticate")).toBeDefined();
      expect(response.headers.get("WWW-Authenticate")).toContain("Bearer");
    });
  });

  describe("JSON-RPC Operations", () => {
    it("returns tools list via tools/list", async () => {
      const request = new Request("http://localhost:3000/api/mcp", {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/list",
          params: {},
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = parseMcpResponse(await response.text());
      const toolNames = data.result.tools.map((t: { name: string }) => t.name);

      expect(toolNames).toContain("search_cars");
      expect(toolNames).toContain("get_car_details");
      expect(toolNames).toContain("get_auth_status");
      expect(toolNames).toContain("list_saved_cars");
      expect(toolNames).toContain("admin_get_dashboard");
      expect(toolNames).toContain("admin_list_cars");
    });

    it("executes get_auth_status as Guest through route handler", async () => {
      const request = new Request("http://localhost:3000/api/mcp", {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: {
            name: "get_auth_status",
            arguments: {},
          },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = parseMcpResponse(await response.text());
      expect(data.result.content[0].text).toContain('"role": "GUEST"');
    });

    it("executes get_auth_status as USER when valid bearer token is supplied", async () => {
      const payload = Buffer.from(
        JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
      ).toString("base64url");
      const token = `header.${payload}.sig`;

      const request = new Request("http://localhost:3000/api/mcp", {
        method: "POST",
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 4,
          method: "tools/call",
          params: {
            name: "get_auth_status",
            arguments: {},
          },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = parseMcpResponse(await response.text());
      expect(data.result.content[0].text).toContain('"role": "USER"');
      expect(data.result.content[0].text).toContain('"userId": "user-456"');
    });
  });

  describe("RFC 9728 Protected Resource Metadata Discovery", () => {
    it("returns RFC 9728 metadata pointing to Supabase Auth issuer", async () => {
      const request = new Request(
        "http://localhost:3000/.well-known/oauth-protected-resource",
        {
          method: "GET",
        },
      );

      const response = await getProtectedResourceMetadata(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.authorization_servers).toContain(
        "https://example.supabase.co/auth/v1",
      );
    });
  });
});
