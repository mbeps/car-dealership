import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAddCarForm } from "@/hooks/use-add-car-form";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/actions/cars/add-car", () => ({
  addCar: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const validFormData = {
  carMakeId: "make-1",
  carColorId: "color-1",
  model: "Model S",
  year: "2024",
  price: "50000",
  mileage: "1000",
  fuelType: "Electric",
  transmission: "Automatic",
  bodyType: "Sedan",
  numberPlate: "ABC-123",
  seats: "5",
  description: "A nice car",
  status: "AVAILABLE" as const,
  featured: false,
  features: ["Sunroof"],
};

const makeFile = (name: string) =>
  new File(["img"], name, { type: "image/png" });

describe("useAddCarForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a form instance with default values", () => {
    const { result } = renderHook(() => useAddCarForm());

    expect(result.current.form.getValues("status")).toBe("AVAILABLE");
    expect(result.current.form.getValues("featured")).toBe(false);
    expect(result.current.uploadedImages).toEqual([]);
    expect(result.current.imageError).toBe("");
    expect(result.current.addCarLoading).toBe(false);
  });

  it("blocks submission and sets an image error when no images are uploaded", async () => {
    const { addCar } = await import("@/actions/cars/add-car");

    const { result } = renderHook(() => useAddCarForm());

    await act(async () => {
      await result.current.onSubmit(validFormData);
    });

    expect(result.current.imageError).toBe("Please upload at least one image");
    expect(addCar).not.toHaveBeenCalled();
  });

  it("clears the image error when setImageError is called", async () => {
    const { result } = renderHook(() => useAddCarForm());

    act(() => {
      result.current.setImageError("boom");
    });
    expect(result.current.imageError).toBe("boom");

    act(() => {
      result.current.setImageError("");
    });
    expect(result.current.imageError).toBe("");
  });

  it("updates uploadedImages via setUploadedImages", () => {
    const { result } = renderHook(() => useAddCarForm());
    const files = [makeFile("a.png")];

    act(() => {
      result.current.setUploadedImages(files);
    });

    expect(result.current.uploadedImages).toEqual(files);
  });

  it("submits carData as parsed JSON plus images in FormData on success", async () => {
    const { addCar } = await import("@/actions/cars/add-car");
    vi.mocked(addCar).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAddCarForm());
    const files = [makeFile("a.png"), makeFile("b.png")];

    act(() => {
      result.current.setUploadedImages(files);
    });

    await act(async () => {
      await result.current.onSubmit(validFormData);
    });

    expect(addCar).toHaveBeenCalledTimes(1);
    const formData = vi.mocked(addCar).mock.calls[0][0] as FormData;
    const carData = JSON.parse(formData.get("carData") as string);
    expect(carData).toEqual(
      expect.objectContaining({
        model: "Model S",
        year: 2024,
        price: 50000,
        mileage: 1000,
        seats: 5,
      }),
    );
    expect(formData.getAll("images")).toHaveLength(2);
  });

  it("omits seats when not provided", async () => {
    const { addCar } = await import("@/actions/cars/add-car");
    vi.mocked(addCar).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAddCarForm());

    act(() => {
      result.current.setUploadedImages([makeFile("a.png")]);
    });

    await act(async () => {
      await result.current.onSubmit({ ...validFormData, seats: "" });
    });

    const carData = JSON.parse(
      (vi.mocked(addCar).mock.calls[0][0] as FormData).get("carData") as string,
    );
    expect(carData.seats).toBeUndefined();
  });

  it("toasts success and redirects to admin cars when the action succeeds", async () => {
    const { addCar } = await import("@/actions/cars/add-car");
    vi.mocked(addCar).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAddCarForm());

    act(() => {
      result.current.setUploadedImages([makeFile("a.png")]);
    });

    await act(async () => {
      await result.current.onSubmit(validFormData);
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Car added successfully");
    });
    expect(mockRouterPush).toHaveBeenCalledWith("/admin/cars");
  });

  it("does not redirect when the action returns without success", async () => {
    const { addCar } = await import("@/actions/cars/add-car");
    vi.mocked(addCar).mockResolvedValue({ success: false, error: "nope" });

    const { result } = renderHook(() => useAddCarForm());

    act(() => {
      result.current.setUploadedImages([makeFile("a.png")]);
    });

    await act(async () => {
      await result.current.onSubmit(validFormData);
    });

    await waitFor(() => {
      expect(toast.success).not.toHaveBeenCalled();
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("surfaces an error toast when the action throws", async () => {
    const { addCar } = await import("@/actions/cars/add-car");
    vi.mocked(addCar).mockRejectedValue(new Error("upload failed"));

    const { result } = renderHook(() => useAddCarForm());

    act(() => {
      result.current.setUploadedImages([makeFile("a.png")]);
    });

    await act(async () => {
      await result.current.onSubmit(validFormData);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("upload failed");
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("exposes loading state while the action is pending", async () => {
    const { addCar } = await import("@/actions/cars/add-car");
    let resolveAction: (value: unknown) => void = () => {};
    vi.mocked(addCar).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );

    const { result } = renderHook(() => useAddCarForm());

    act(() => {
      result.current.setUploadedImages([makeFile("a.png")]);
    });

    let submitPromise: Promise<void> = Promise.resolve();
    act(() => {
      submitPromise = result.current.onSubmit(validFormData);
    });

    await waitFor(() => {
      expect(result.current.addCarLoading).toBe(true);
    });

    resolveAction({ success: true });
    await act(async () => {
      await submitPromise;
    });

    expect(result.current.addCarLoading).toBe(false);
  });
});
