import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import useFetch from "@/hooks/use-fetch";

const { toastError } = vi.hoisted(() => ({
  toastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: toastError },
}));

describe("useFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toggles loading state and stores resolved data", async () => {
    const cb = vi.fn().mockResolvedValue("ok");
    const { result } = renderHook(() => useFetch(cb));

    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.fn();
    });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe("ok");
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);

    act(() => {
      result.current.setData("updated");
    });
    expect(result.current.data).toBe("updated");
  });

  it("captures errors and surfaces toast", async () => {
    const error = new Error("Failed request");
    const cb = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useFetch(cb));

    await act(async () => {
      await result.current.fn();
    });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(error);
    expect(result.current.loading).toBe(false);
    expect(toastError).toHaveBeenCalledWith("Failed request");
  });
});
