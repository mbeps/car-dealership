import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSignIn } from "@/hooks/use-sign-in";

const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignInWithPasskey = vi.fn();
const mockRegisterPasskey = vi.fn();
const mockRouterPush = vi.fn();
const mockRouterRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    refresh: mockRouterRefresh,
  }),
}));

vi.mock("@/lib/supabase/supabase-client", () => ({
  createBrowserClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
      signInWithPasskey: mockSignInWithPasskey,
      registerPasskey: mockRegisterPasskey,
    },
  }),
}));

describe("useSignIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithPassword.mockReset();
    mockSignInWithOAuth.mockReset();
    mockSignInWithPasskey.mockReset();
    mockRegisterPasskey.mockReset();
    mockRouterPush.mockReset();
    mockRouterRefresh.mockReset();
    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      value: class MockPublicKeyCredential {},
    });
  });

  it("calls the Supabase passkey sign-in method when browser support is available", async () => {
    mockSignInWithPasskey.mockResolvedValue({ data: {}, error: null });

    const { result } = renderHook(() => useSignIn());

    await act(async () => {
      await result.current.signInWithPasskey();
    });

    expect(mockSignInWithPasskey).toHaveBeenCalledTimes(1);
  });

  it("returns a graceful error when passkeys are unsupported", async () => {
    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useSignIn());

    const response = await result.current.signInWithPasskey();

    expect(response.success).toBe(false);
    expect((response.error as Error).message).toContain("not supported");
    expect(mockSignInWithPasskey).not.toHaveBeenCalled();
  });
});
