import { OAuthError, OAuthErrorCode } from "@modelcontextprotocol/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRoleEnum as UserRole } from "@/enums/user-role";

const h = vi.hoisted(() => {
  const mockAuthUser = { id: "auth-123", email: "user@example.com" };
  const mockDbUser = { id: "user-456", role: "USER" };
  const getUserMock = vi.fn();
  const getOrCreateDbUserMock = vi.fn();
  const createClientMock = vi.fn();
  const createTokenClientMock = vi.fn();

  return {
    mockAuthUser,
    mockDbUser,
    getUserMock,
    getOrCreateDbUserMock,
    createClientMock,
    createTokenClientMock,
  };
});

vi.mock("@/actions/cars/get-or-create-db-user", () => ({
  getOrCreateDbUser: (...args: unknown[]) => h.getOrCreateDbUserMock(...args),
}));

vi.mock("@/lib/supabase/supabase", () => ({
  createTokenClient: (...args: unknown[]) => h.createTokenClientMock(...args),
  createClient: (...args: unknown[]) => h.createClientMock(...args),
}));

import {
  getMcpAuth,
  requireAdmin,
  requireUser,
  verifyMcpToken,
} from "@/lib/mcp/auth";

describe("verifyMcpToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.getOrCreateDbUserMock.mockResolvedValue(h.mockDbUser);
    h.getUserMock.mockResolvedValue({
      data: { user: h.mockAuthUser },
      error: null,
    });
    h.createTokenClientMock.mockReturnValue({
      auth: { getUser: h.getUserMock },
    });
    h.createClientMock.mockResolvedValue({
      auth: { getUser: h.getUserMock },
    });
  });

  it("returns undefined for unauthenticated Guest requests (no token, no cookies)", async () => {
    const req = new Request("http://localhost/api/mcp", {
      method: "POST",
    });

    const result = await verifyMcpToken(req);
    expect(result).toBeUndefined();
  });

  it("resolves AuthInfo for valid USER bearer token and creates DB user if missing", async () => {
    // Generate a valid JWT-like string with base64url header.payload.signature
    const payload = Buffer.from(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
    ).toString("base64url");
    const token = `header.${payload}.sig`;

    const req = new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await verifyMcpToken(req, token);

    expect(result).toBeDefined();
    expect(result?.token).toBe(token);
    expect(result?.scopes).toEqual(["user"]);
    expect(result?.expiresAt).toBeGreaterThan(Date.now() / 1000);
    expect(result?.extra).toMatchObject({
      authUserId: "auth-123",
      userId: "user-456",
      email: "user@example.com",
      role: UserRole.USER,
    });
    expect(h.getOrCreateDbUserMock).toHaveBeenCalled();
  });

  it("resolves AuthInfo with admin scope for valid ADMIN bearer token", async () => {
    h.getOrCreateDbUserMock.mockResolvedValue({
      id: "admin-789",
      role: UserRole.ADMIN,
    });

    const token = "admin-jwt-token";
    const req = new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await verifyMcpToken(req, token);

    expect(result).toBeDefined();
    expect(result?.scopes).toEqual(["user", "admin"]);
    expect(result?.extra).toMatchObject({
      role: UserRole.ADMIN,
      userId: "admin-789",
    });
  });

  it("throws OAuthError(InvalidToken) when explicit bearer token is invalid", async () => {
    h.getUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid JWT" },
    });

    const token = "bad-jwt";
    const req = new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    await expect(verifyMcpToken(req, token)).rejects.toThrow(OAuthError);
    await expect(verifyMcpToken(req, token)).rejects.toMatchObject({
      code: OAuthErrorCode.InvalidToken,
    });
  });

  it("falls back to SSR cookie session when no bearer header is present", async () => {
    const req = new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        cookie: "sb-auth-token=session-cookie-value",
      },
    });

    const result = await verifyMcpToken(req);

    expect(result).toBeDefined();
    expect(result?.scopes).toEqual(["user"]);
    expect(result?.extra).toMatchObject({
      userId: "user-456",
      role: UserRole.USER,
    });
    expect(h.createClientMock).toHaveBeenCalled();
  });

  it("returns undefined when SSR cookie session lookup fails or user is null", async () => {
    h.getUserMock.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const req = new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        cookie: "sb-auth-token=invalid-cookie",
      },
    });

    const result = await verifyMcpToken(req);
    expect(result).toBeUndefined();
  });

  it("throws OAuthError(InvalidToken) when ?auth=required is set and request is unauthenticated", async () => {
    const req = new Request("http://localhost/api/mcp?auth=required", {
      method: "POST",
    });

    await expect(verifyMcpToken(req)).rejects.toThrow(OAuthError);
    await expect(verifyMcpToken(req)).rejects.toMatchObject({
      code: OAuthErrorCode.InvalidToken,
      message: "Authentication required",
    });
  });
});

describe("auth guard helpers", () => {
  const userContext = {
    authUserId: "auth-u",
    userId: "db-u",
    email: "user@example.com",
    role: UserRole.USER,
    supabase: {} as never,
  };

  const adminContext = {
    authUserId: "auth-a",
    userId: "db-a",
    email: "admin@example.com",
    role: UserRole.ADMIN,
    supabase: {} as never,
  };

  it("getMcpAuth retrieves context from ctx.http.authInfo or ctx.authInfo", () => {
    const ctxHttp = { http: { authInfo: { extra: userContext } } };
    expect(getMcpAuth(ctxHttp)).toEqual(userContext);

    const ctxDirect = { authInfo: { extra: adminContext } };
    expect(getMcpAuth(ctxDirect)).toEqual(adminContext);

    expect(getMcpAuth({})).toBeNull();
    expect(getMcpAuth(null)).toBeNull();
  });

  it("requireUser succeeds for authenticated users and throws for guests", () => {
    const ctx = { http: { authInfo: { extra: userContext } } };
    expect(requireUser(ctx)).toEqual(userContext);

    expect(() => requireUser({})).toThrow(/Unauthorized/);
  });

  it("requireAdmin succeeds for admin users and throws for user or guest", () => {
    const adminCtx = { http: { authInfo: { extra: adminContext } } };
    expect(requireAdmin(adminCtx)).toEqual(adminContext);

    const userCtx = { http: { authInfo: { extra: userContext } } };
    expect(() => requireAdmin(userCtx)).toThrow(/Forbidden.*Admin/);

    expect(() => requireAdmin({})).toThrow(/Unauthorized/);
  });
});
