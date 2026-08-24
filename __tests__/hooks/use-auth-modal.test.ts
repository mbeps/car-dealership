import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import useAuthModal from "@/hooks/useAuthModal";

describe("useAuthModal", () => {
  beforeEach(() => {
    // Reset zustand store state between tests
    const { isOpen, onOpen, onClose } = useAuthModal.getState();
    if (isOpen) onClose();
    void onOpen; // keep destructuring honest for lint
    useAuthModal.setState({ isOpen: false, redirectUrl: undefined });
  });

  it("starts closed with no redirect URL", () => {
    const { result } = renderHook(() => useAuthModal());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.redirectUrl).toBeUndefined();
  });

  it("opens the modal", () => {
    renderHook(() => useAuthModal());

    act(() => {
      useAuthModal.getState().onOpen();
    });

    expect(useAuthModal.getState().isOpen).toBe(true);
  });

  it("opens the modal with a redirect URL", () => {
    act(() => {
      useAuthModal.getState().onOpen("/admin/cars");
    });

    expect(useAuthModal.getState().redirectUrl).toBe("/admin/cars");
  });

  it("closes the modal and clears the redirect URL", () => {
    act(() => {
      useAuthModal.getState().onOpen("/admin/cars");
    });
    act(() => {
      useAuthModal.getState().onClose();
    });

    expect(useAuthModal.getState().isOpen).toBe(false);
    expect(useAuthModal.getState().redirectUrl).toBeUndefined();
  });

  it("shares state across hook instances (global store)", () => {
    const a = renderHook(() => useAuthModal());
    const b = renderHook(() => useAuthModal());

    act(() => {
      useAuthModal.getState().onOpen("/next");
    });

    expect(a.result.current.isOpen).toBe(true);
    expect(b.result.current.redirectUrl).toBe("/next");
  });
});
