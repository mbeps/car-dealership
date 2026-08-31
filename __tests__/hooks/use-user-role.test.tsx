import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { useUserRole } from "@/hooks/use-user-role";

const mockGetCurrentUserRole = vi.fn();
const mockUser = vi.fn();

vi.mock("@/actions/auth/get-current-user-role", () => ({
  getCurrentUserRole: (...args: unknown[]) => mockGetCurrentUserRole(...args),
}));

vi.mock("@/hooks/useUser", () => ({
  useUser: () => ({ user: mockUser() }),
}));

describe("useUserRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and returns the role for a signed-in user", async () => {
    mockUser.mockReturnValue({ id: "u1" });
    mockGetCurrentUserRole.mockResolvedValue({
      success: true,
      data: { role: UserRole.ADMIN },
    });

    const { result } = renderHook(() => useUserRole());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetCurrentUserRole).toHaveBeenCalledTimes(1);
    expect(result.current.role).toBe(UserRole.ADMIN);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isUser).toBe(false);
  });

  it("reports isUser true for the USER role", async () => {
    mockUser.mockReturnValue({ id: "u1" });
    mockGetCurrentUserRole.mockResolvedValue({
      success: true,
      data: { role: UserRole.USER },
    });

    const { result } = renderHook(() => useUserRole());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isUser).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it("skips fetching when signed out and clears role", async () => {
    mockUser.mockReturnValue(null);

    const { result } = renderHook(() => useUserRole());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetCurrentUserRole).not.toHaveBeenCalled();
    expect(result.current.role).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  it("starts in loading state before the fetch resolves", async () => {
    mockUser.mockReturnValue({ id: "u1" });
    let resolveFetch!: (v: unknown) => void;
    mockGetCurrentUserRole.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const { result } = renderHook(() => useUserRole());

    expect(result.current.loading).toBe(true);

    resolveFetch({ success: true, data: { role: UserRole.USER } });
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("sets role to null on action failure", async () => {
    mockUser.mockReturnValue({ id: "u1" });
    mockGetCurrentUserRole.mockResolvedValue({ success: false, error: "nope" });

    const { result } = renderHook(() => useUserRole());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.role).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  it("sets role to null when the action throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockUser.mockReturnValue({ id: "u1" });
    mockGetCurrentUserRole.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useUserRole());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.role).toBeNull();
    consoleError.mockRestore();
  });

  it("refetches when the user changes", async () => {
    mockUser.mockReturnValue({ id: "u1" });
    mockGetCurrentUserRole.mockResolvedValue({
      success: true,
      data: { role: UserRole.USER },
    });

    const { rerender } = renderHook(() => useUserRole());

    await waitFor(() =>
      expect(mockGetCurrentUserRole).toHaveBeenCalledTimes(1),
    );

    act(() => {
      mockUser.mockReturnValue({ id: "u2" });
    });
    rerender();

    await waitFor(() =>
      expect(mockGetCurrentUserRole).toHaveBeenCalledTimes(2),
    );
  });
});
