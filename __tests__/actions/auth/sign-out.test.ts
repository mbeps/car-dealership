import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/supabase", () => ({
  createClient: async () => ({
    auth: { signOut: mocks.signOut },
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/arcjet", () => ({ default: {} }));

import { signOut } from "@/actions/auth/sign-out";

describe("signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls supabase auth.signOut then redirects home", async () => {
    mocks.signOut.mockResolvedValue({ error: null });

    await signOut();

    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  it("redirects to ROUTES.HOME.HOME (order matters: sign out first)", async () => {
    mocks.signOut.mockResolvedValue({ error: null });
    const callOrder: string[] = [];
    mocks.signOut.mockImplementation(async () => {
      callOrder.push("signOut");
      return { error: null };
    });
    mocks.redirect.mockImplementation(() => {
      callOrder.push("redirect");
    });

    await signOut();

    expect(callOrder).toEqual(["signOut", "redirect"]);
  });

  it("still redirects even if signOut resolves without a value", async () => {
    mocks.signOut.mockResolvedValue(undefined);

    await signOut();

    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  it("propagates when supabase signOut rejects", async () => {
    mocks.signOut.mockRejectedValue(new Error("signout failed"));

    await expect(signOut()).rejects.toThrow("signout failed");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("lets the redirect error escape (Next.js control flow)", async () => {
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT");
  });
});
