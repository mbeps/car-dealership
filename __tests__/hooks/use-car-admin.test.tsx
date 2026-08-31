import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCarAdmin } from "@/hooks/use-car-admin";

vi.mock("@/actions/cars/delete-car", () => ({
  deleteCar: vi.fn(),
}));

vi.mock("@/actions/cars/update-car-status", () => ({
  updateCarStatus: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const getMocks = async () => {
  const { deleteCar } = await import("@/actions/cars/delete-car");
  const { updateCarStatus } = await import("@/actions/cars/update-car-status");
  return {
    deleteCar: vi.mocked(deleteCar),
    updateCarStatus: vi.mocked(updateCarStatus),
  };
};

describe("useCarAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with no loading states", () => {
    const { result } = renderHook(() => useCarAdmin());

    expect(result.current.deletingCar).toBe(false);
    expect(result.current.updatingStatus).toBe(false);
  });

  it("deletes a car by id and toasts success", async () => {
    const { deleteCar } = await getMocks();
    deleteCar.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useCarAdmin());

    await act(async () => {
      await result.current.handleDeleteCar("car-1");
    });

    expect(deleteCar).toHaveBeenCalledWith("car-1");
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Car deleted successfully");
    });
  });

  it("fires onDeleteSuccess callback after successful deletion", async () => {
    const { deleteCar } = await getMocks();
    deleteCar.mockResolvedValue({ success: true });
    const onDeleteSuccess = vi.fn();

    const { result } = renderHook(() => useCarAdmin({ onDeleteSuccess }));

    await act(async () => {
      await result.current.handleDeleteCar("car-1");
    });

    await waitFor(() => {
      expect(onDeleteSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it("does not fire onDeleteSuccess when deletion fails", async () => {
    const { deleteCar } = await getMocks();
    deleteCar.mockResolvedValue({ success: false });
    const onDeleteSuccess = vi.fn();

    const { result } = renderHook(() => useCarAdmin({ onDeleteSuccess }));

    await act(async () => {
      await result.current.handleDeleteCar("car-1");
    });

    await waitFor(() => {
      expect(onDeleteSuccess).not.toHaveBeenCalled();
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("toasts an error when deletion throws", async () => {
    const { deleteCar } = await getMocks();
    deleteCar.mockRejectedValue(new Error("db down"));

    const { result } = renderHook(() => useCarAdmin());

    await act(async () => {
      await result.current.handleDeleteCar("car-1");
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to delete car");
    });
  });

  it("updates status with the given carId and status payload", async () => {
    const { updateCarStatus } = await getMocks();
    updateCarStatus.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useCarAdmin());

    await act(async () => {
      await result.current.handleUpdateStatus("car-2", "SOLD");
    });

    expect(updateCarStatus).toHaveBeenCalledWith("car-2", {
      status: "SOLD",
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Car status updated");
    });
  });

  it("toggles featured off when currently featured", async () => {
    const { updateCarStatus } = await getMocks();
    updateCarStatus.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useCarAdmin());

    await act(async () => {
      await result.current.handleToggleFeatured("car-3", true);
    });

    expect(updateCarStatus).toHaveBeenCalledWith("car-3", {
      featured: false,
    });
  });

  it("toggles featured on when not currently featured", async () => {
    const { updateCarStatus } = await getMocks();
    updateCarStatus.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useCarAdmin());

    await act(async () => {
      await result.current.handleToggleFeatured("car-3", false);
    });

    expect(updateCarStatus).toHaveBeenCalledWith("car-3", {
      featured: true,
    });
  });

  it("fires onUpdateSuccess callback after successful status update", async () => {
    const { updateCarStatus } = await getMocks();
    updateCarStatus.mockResolvedValue({ success: true });
    const onUpdateSuccess = vi.fn();

    const { result } = renderHook(() => useCarAdmin({ onUpdateSuccess }));

    await act(async () => {
      await result.current.handleUpdateStatus("car-4", "AVAILABLE");
    });

    await waitFor(() => {
      expect(onUpdateSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it("toasts an error when status update throws", async () => {
    const { updateCarStatus } = await getMocks();
    updateCarStatus.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useCarAdmin());

    await act(async () => {
      await result.current.handleUpdateStatus("car-5", "AVAILABLE");
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update car status");
    });
  });

  it("shows loading state while a status update is pending", async () => {
    const { updateCarStatus } = await getMocks();
    let resolveAction: (value: unknown) => void = () => {};
    updateCarStatus.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );

    const { result } = renderHook(() => useCarAdmin());

    let opPromise: Promise<unknown> = Promise.resolve();
    act(() => {
      opPromise = result.current.handleUpdateStatus("car-6", "AVAILABLE");
    });

    await waitFor(() => {
      expect(result.current.updatingStatus).toBe(true);
    });

    resolveAction({ success: true });
    await act(async () => {
      await opPromise;
    });

    expect(result.current.updatingStatus).toBe(false);
  });
});
