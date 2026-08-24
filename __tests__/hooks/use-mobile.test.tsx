import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "@/hooks/use-mobile";

let listeners: Array<() => void> = [];

const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  addEventListener: (_: string, cb: () => void) => {
    listeners.push(cb);
  },
  removeEventListener: (_: string, cb: () => void) => {
    listeners = listeners.filter((l) => l !== cb);
  },
}));

describe("useIsMobile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners = [];
    vi.stubGlobal("matchMedia", matchMediaMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function fireResize(width: number) {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: width,
    });
    listeners.forEach((cb) => cb());
  }

  it("queries the mobile breakpoint media query", () => {
    renderHook(() => useIsMobile());

    expect(matchMediaMock).toHaveBeenCalledWith("(max-width: 767px)");
  });

  it("returns false at desktop width", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it("returns true after resizing below the breakpoint", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => fireResize(375));
    expect(result.current).toBe(true);
  });

  it("flips back to false when crossing above the breakpoint", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 375,
    });

    const { result } = renderHook(() => useIsMobile());
    act(() => fireResize(375));
    expect(result.current).toBe(true);

    act(() => fireResize(1280));
    expect(result.current).toBe(false);
  });

  it("removes its change listener on unmount", () => {
    const { unmount } = renderHook(() => useIsMobile());

    expect(listeners.length).toBe(1);
    unmount();
    expect(listeners.length).toBe(0);
  });
});
