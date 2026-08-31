import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CarCard } from "@/components/car-card";
import type { SerializedCar } from "@/types/car/serialized-car";

const mockUseUser = vi.fn();
const mockOpenSignIn = vi.fn();
const mockPush = vi.fn();
const mockToggleSavedCar = vi.fn();

vi.mock("@/hooks/useUser", () => ({
  useUser: () => mockUseUser(),
}));

vi.mock("@/hooks/useAuthModal", () => ({
  default: () => ({ onOpen: mockOpenSignIn }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/actions/cars/toggle-saved-car", () => ({
  toggleSavedCar: (...args: unknown[]) => mockToggleSavedCar(...args),
}));

const baseCar: SerializedCar = {
  id: "car-1",
  carMakeId: "make-1",
  carColorId: "color-1",
  make: "Toyota",
  model: "Corolla",
  year: 2022,
  price: 24999,
  mileage: 15000,
  color: "Blue",
  fuelType: "Petrol",
  transmission: "Automatic",
  bodyType: "Sedan",
  numberPlate: "AB12 CDE",
  seats: 5,
  description: "A reliable car",
  status: "APPROVED",
  featured: false,
  features: [],
  images: ["https://example.com/car.jpg"],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const getSaveButton = (): HTMLElement => {
  const button = screen
    .getAllByRole("button")
    .find((b) => b.className.includes("rounded-full"));
  if (!button) throw new Error("Save button not found");
  return button;
};

describe("CarCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUser.mockReturnValue({ user: null });
  });

  it("renders make, model, year, specs and badges", () => {
    render(<CarCard car={baseCar} />);

    expect(screen.getByText("Toyota Corolla")).toBeInTheDocument();
    expect(screen.getByText("2022")).toBeInTheDocument();
    expect(screen.getByText("Automatic")).toBeInTheDocument();
    expect(screen.getByText("Petrol")).toBeInTheDocument();
    expect(screen.getByText("Sedan")).toBeInTheDocument();
    expect(screen.getByText("15,000 miles")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
  });

  it("formats the price as GBP without decimals", () => {
    render(<CarCard car={baseCar} />);

    expect(screen.getByText("£24,999")).toBeInTheDocument();
  });

  it("renders the car image when images are present", () => {
    render(<CarCard car={baseCar} />);

    expect(screen.getByAltText("Toyota Corolla")).toBeInTheDocument();
  });

  it("renders a placeholder instead of an image when there are none", () => {
    render(<CarCard car={{ ...baseCar, images: [] }} />);

    expect(screen.queryByAltText("Toyota Corolla")).not.toBeInTheDocument();
  });

  it("navigates to the car details route when View Car is clicked", () => {
    render(<CarCard car={baseCar} />);

    fireEvent.click(screen.getByRole("button", { name: /view car/i }));

    expect(mockPush).toHaveBeenCalledWith("/cars/car-1");
  });

  it("reflects the wishlisted prop in the save button styling", () => {
    render(<CarCard car={{ ...baseCar, wishlisted: true }} />);

    const saveButton = getSaveButton();
    expect(saveButton.className).toContain("text-red-500");
  });

  it("renders unsaved styling when not wishlisted", () => {
    render(<CarCard car={baseCar} />);

    expect(getSaveButton().className).not.toContain("text-red-500");
  });

  it("opens the sign-in modal for unauthenticated users trying to save", async () => {
    render(<CarCard car={baseCar} />);

    fireEvent.click(getSaveButton());

    await waitFor(() => {
      expect(mockOpenSignIn).toHaveBeenCalled();
    });
    expect(mockToggleSavedCar).not.toHaveBeenCalled();
  });

  it("toggles the saved state via the server action for signed-in users", async () => {
    mockUseUser.mockReturnValue({ user: { id: "user-1" } });
    mockToggleSavedCar.mockResolvedValue({
      success: true,
      data: { saved: true, message: "Car saved" },
    });

    render(<CarCard car={baseCar} />);

    fireEvent.click(getSaveButton());

    await waitFor(() => {
      expect(mockToggleSavedCar).toHaveBeenCalledWith("car-1");
    });
  });

  it("does not call the action when the user is signed out", async () => {
    render(<CarCard car={baseCar} />);

    fireEvent.click(getSaveButton());

    await waitFor(() => {
      expect(mockOpenSignIn).toHaveBeenCalled();
    });
    expect(mockToggleSavedCar).not.toHaveBeenCalled();
  });
});
