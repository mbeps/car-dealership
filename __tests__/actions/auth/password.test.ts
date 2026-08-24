import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  siteUrl: "https://example.com",
}));

vi.mock("@/lib/supabase/supabase", () => ({
  createClient: async () => ({
    auth: {
      getUser: mocks.getUser,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      updateUser: mocks.updateUser,
    },
  }),
}));

vi.mock("@/lib/site-url", () => ({
  getSiteUrl: () => mocks.siteUrl,
}));

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/arcjet", () => ({ default: {} }));

import { requestPasswordReset } from "@/actions/auth/request-password-reset";
import { updatePassword } from "@/actions/auth/update-password";

describe("requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends reset email with redirectTo built from site url + update-password route", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    const res = await requestPasswordReset("user@example.com");

    expect(res).toEqual({ success: true, data: null });
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({
        redirectTo: "https://example.com/update-password",
      }),
    );
  });

  it("forwards the exact email argument", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    await requestPasswordReset("other@example.com");

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
      "other@example.com",
      expect.anything(),
    );
  });

  it("returns failure with the supabase error message", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({
      data: null,
      error: { message: "invalid email" },
    });

    const res = await requestPasswordReset("bad");

    expect(res).toEqual({ success: false, error: "invalid email" });
  });

  it("catches thrown errors and returns failure", async () => {
    mocks.resetPasswordForEmail.mockRejectedValue(new Error("smtp down"));

    const res = await requestPasswordReset("user@example.com");

    expect(res.success).toBe(false);
    expect(res.error).toBe("smtp down");
  });
});

describe("updatePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when not authenticated without calling updateUser", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await updatePassword("new-secret-1");

    expect(res).toEqual({ success: false, error: "Not authenticated" });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("updates the password for an authenticated user", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "auth-1" } },
      error: null,
    });
    mocks.updateUser.mockResolvedValue({ data: { user: {} }, error: null });

    const res = await updatePassword("new-secret-1");

    expect(res).toEqual({ success: true, data: null });
    expect(mocks.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ password: "new-secret-1" }),
    );
  });

  it("returns failure when updateUser reports an error", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "auth-1" } },
      error: null,
    });
    mocks.updateUser.mockResolvedValue({
      data: null,
      error: { message: "password too weak" },
    });

    const res = await updatePassword("123");

    expect(res).toEqual({ success: false, error: "password too weak" });
  });

  it("returns failure when auth.getUser itself errors", async () => {
    mocks.getUser.mockRejectedValue(new Error("session expired"));

    const res = await updatePassword("new-secret-1");

    expect(res.success).toBe(false);
    expect(res.error).toBe("session expired");
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("does not leak the password in the returned response", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "auth-1" } },
      error: null,
    });
    mocks.updateUser.mockResolvedValue({ data: { user: {} }, error: null });

    const res = await updatePassword("super-secret");

    expect(JSON.stringify(res)).not.toContain("super-secret");
  });
});
