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

  it("handles successful signInWithEmail with callbacks", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useSignIn({ onSuccess, redirectUrl: "/dashboard" }),
    );

    let res: { success: boolean } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail("test@example.com", "secret");
    });

    expect(res?.success).toBe(true);
    expect(result.current.success).toBe("Signed in successfully!");
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith("/dashboard");
    expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
  });

  it("handles signInWithEmail failure from Supabase", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid credentials" },
    });

    const { result } = renderHook(() => useSignIn());

    let res: { success: boolean } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail("test@example.com", "wrong");
    });

    expect(res?.success).toBe(false);
    expect(result.current.error).toBe("Invalid credentials");
  });

  it("handles signInWithEmail unexpected exception", async () => {
    mockSignInWithPassword.mockRejectedValue(new Error("Network boom"));

    const { result } = renderHook(() => useSignIn());

    let res: { success: boolean } | undefined;
    await act(async () => {
      res = await result.current.signInWithEmail("test@example.com", "wrong");
    });

    expect(res?.success).toBe(false);
    expect(result.current.error).toBe("An unexpected error occurred");
  });

  it("handles signInWithGoogle successfully", async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useSignIn({ redirectUrl: "/cars" }));

    let res: { success: boolean } | undefined;
    await act(async () => {
      res = await result.current.signInWithGoogle();
    });

    expect(res?.success).toBe(true);
    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
      }),
    );
  });

  it("handles signInWithGoogle error from Supabase", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      error: { message: "OAuth failed" },
    });

    const { result } = renderHook(() => useSignIn());

    let res: { success: boolean } | undefined;
    await act(async () => {
      res = await result.current.signInWithGoogle();
    });

    expect(res?.success).toBe(false);
    expect(result.current.error).toBe("OAuth failed");
  });

  it("handles registerPasskey success", async () => {
    mockRegisterPasskey.mockResolvedValue({
      data: { id: "pk_1" },
      error: null,
    });

    const { result } = renderHook(() => useSignIn());

    let res: { success: boolean } | undefined;
    await act(async () => {
      res = await result.current.registerPasskey();
    });

    expect(res?.success).toBe(true);
    expect(result.current.success).toBe("Passkey added successfully.");
  });

  it("handles registerPasskey error when unsupported", async () => {
    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useSignIn());

    let res: { success: boolean } | undefined;
    await act(async () => {
      res = await result.current.registerPasskey();
    });

    expect(res?.success).toBe(false);
    expect(result.current.error).toContain("not supported");
  });
});
