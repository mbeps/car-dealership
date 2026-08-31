import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const single = vi.fn();
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const getUser = vi.fn();
  return { from, select, eq, single, getUser };
});

vi.mock("@/lib/supabase/supabase", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/arcjet", () => ({ default: {} }));

import { getCurrentUser } from "@/actions/auth/get-current-user";
import { getCurrentUserRole } from "@/actions/auth/get-current-user-role";
import { isCurrentUserAdmin } from "@/actions/auth/is-current-user-admin";

const AUTH_USER = { id: "auth-1", email: "a@b.c" };

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eq.mockImplementation(() => ({ single: mocks.single }));
    mocks.select.mockImplementation(() => ({ eq: mocks.eq }));
    mocks.from.mockImplementation(() => ({ select: mocks.select }));
  });

  it("returns null when not signed in", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await getCurrentUser();

    expect(res).toEqual({ success: true, data: null });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("fetches profile filtered by supabaseAuthUserId and returns it", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });
    const profile = { id: "u1", role: "USER" };
    mocks.single.mockResolvedValue({ data: profile, error: null });

    const res = await getCurrentUser();

    expect(res.success).toBe(true);
    expect(res.data).toEqual(profile);
    expect(mocks.from).toHaveBeenCalledWith("User");
    expect(mocks.select).toHaveBeenCalledWith("*");
    expect(mocks.eq).toHaveBeenCalledWith("supabaseAuthUserId", AUTH_USER.id);
  });

  it("returns failure when the profile query errors", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });
    mocks.single.mockResolvedValue({
      data: null,
      error: new Error("db down"),
    });

    const res = await getCurrentUser();

    expect(res.success).toBe(false);
    expect(res.error).toBe("db down");
  });
});

describe("getCurrentUserRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eq.mockImplementation(() => ({ single: mocks.single }));
    mocks.select.mockImplementation(() => ({ eq: mocks.eq }));
    mocks.from.mockImplementation(() => ({ select: mocks.select }));
  });

  it("returns null role when signed out", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await getCurrentUserRole();

    expect(res).toEqual({ success: true, data: { role: null } });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("selects only the role column for the authenticated user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });
    mocks.single.mockResolvedValue({ data: { role: "ADMIN" }, error: null });

    const res = await getCurrentUserRole();

    expect(res).toEqual({ success: true, data: { role: "ADMIN" } });
    expect(mocks.select).toHaveBeenCalledWith("role");
    expect(mocks.eq).toHaveBeenCalledWith("supabaseAuthUserId", AUTH_USER.id);
  });

  it("returns null role when the profile row is missing", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });
    mocks.single.mockResolvedValue({ data: null, error: null });

    const res = await getCurrentUserRole();

    expect(res).toEqual({ success: true, data: { role: null } });
  });

  it("returns failure on unexpected exception", async () => {
    mocks.getUser.mockRejectedValue(new Error("boom"));

    const res = await getCurrentUserRole();

    expect(res.success).toBe(false);
    expect(res.error).toBe("boom");
  });
});

describe("isCurrentUserAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eq.mockImplementation(() => ({ single: mocks.single }));
    mocks.select.mockImplementation(() => ({ eq: mocks.eq }));
    mocks.from.mockImplementation(() => ({ select: mocks.select }));
  });

  it("returns false when signed out without querying the db", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(isCurrentUserAdmin()).resolves.toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("returns true for an ADMIN role user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });
    mocks.single.mockResolvedValue({ data: { role: "ADMIN" }, error: null });

    await expect(isCurrentUserAdmin()).resolves.toBe(true);
  });

  it("returns false for a non-admin user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });
    mocks.single.mockResolvedValue({ data: { role: "USER" }, error: null });

    await expect(isCurrentUserAdmin()).resolves.toBe(false);
  });

  it("returns false when the profile row is missing", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });
    mocks.single.mockResolvedValue({ data: null, error: null });

    await expect(isCurrentUserAdmin()).resolves.toBe(false);
  });

  it("returns false instead of throwing on db error", async () => {
    mocks.getUser.mockRejectedValue(new Error("network"));

    await expect(isCurrentUserAdmin()).resolves.toBe(false);
  });
});
