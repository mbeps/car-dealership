import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TestDriveCard } from "@/components/test-drive-card";
import { BookingStatusEnum } from "@/enums/booking-status";
import type { SerializedCar } from "@/types/car/serialized-car";
import type { TestDriveBookingWithCar } from "@/types/test-drive/test-drive-booking-with-car";
import type { TestDriveBookingWithUser } from "@/types/test-drive/test-drive-booking-with-user";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const mockOnCancel = vi.fn();

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

const makeBooking = (
  overrides: Partial<TestDriveBookingWithCar> = {},
): TestDriveBookingWithCar => ({
  id: "booking-1",
  carId: "car-1",
  userId: "user-1",
  bookingDate: "2030-06-15T00:00:00Z",
  startTime: "09:30",
  endTime: "10:30",
  status: BookingStatusEnum.PENDING,
  notes: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  car: baseCar,
  ...overrides,
});

describe("TestDriveCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnCancel.mockResolvedValue(undefined);
  });

  it.each([
    [BookingStatusEnum.PENDING, "Pending"],
    [BookingStatusEnum.CONFIRMED, "Confirmed"],
    [BookingStatusEnum.COMPLETED, "Completed"],
    [BookingStatusEnum.CANCELLED, "Cancelled"],
    [BookingStatusEnum.NO_SHOW, "No Show"],
  ])("renders the %s status badge", (status, label) => {
    render(<TestDriveCard booking={makeBooking({ status })} />);

    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  });

  it("renders car year, make and model", () => {
    render(<TestDriveCard booking={makeBooking()} />);

    expect(screen.getByText(/2022 Toyota Corolla/i)).toBeInTheDocument();
  });

  it("renders formatted booking date and time range", () => {
    render(<TestDriveCard booking={makeBooking()} />);

    expect(screen.getByText(/Saturday, June 15, 2030/i)).toBeInTheDocument();
    expect(screen.getByText(/9:30 AM - 10:30 AM/i)).toBeInTheDocument();
  });

  it("renders the car image when images are present", () => {
    render(<TestDriveCard booking={makeBooking()} />);

    expect(screen.getByAltText("Toyota Corolla")).toBeInTheDocument();
  });

  it("renders a placeholder instead of an image when there are none", () => {
    const booking = makeBooking({ car: { ...baseCar, images: [] } });

    render(<TestDriveCard booking={booking} />);

    expect(screen.queryByAltText("Toyota Corolla")).not.toBeInTheDocument();
  });

  it("shows a View Car link pointing to the car details route", () => {
    render(<TestDriveCard booking={makeBooking()} />);

    expect(screen.getByRole("link", { name: /view car/i })).toHaveAttribute(
      "href",
      "/cars/car-1",
    );
  });

  it("hides action buttons when showActions is false", () => {
    render(<TestDriveCard booking={makeBooking()} showActions={false} />);

    expect(
      screen.queryByRole("button", { name: /cancel/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /view car/i }),
    ).not.toBeInTheDocument();
  });

  it("does not show the Cancel button for terminal statuses", () => {
    render(
      <TestDriveCard
        booking={makeBooking({ status: BookingStatusEnum.COMPLETED })}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /cancel/i }),
    ).not.toBeInTheDocument();
  });

  it("opens the confirmation dialog when Cancel is clicked", async () => {
    render(<TestDriveCard booking={makeBooking()} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/cancel test drive/i)).toBeInTheDocument();
  });

  it("invokes onCancel with the booking id on confirm", async () => {
    render(<TestDriveCard booking={makeBooking()} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    fireEvent.click(
      await screen.findByRole("button", { name: /cancel reservation/i }),
    );

    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalledWith("booking-1");
    });
  });

  it("closes the dialog after successful cancellation", async () => {
    render(<TestDriveCard booking={makeBooking()} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    fireEvent.click(
      await screen.findByRole("button", { name: /cancel reservation/i }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  it("shows customer details in admin view", () => {
    const booking = {
      ...makeBooking(),
      user: { id: "user-1", email: "jane@example.com", name: "Jane Doe" },
    } as unknown as TestDriveBookingWithUser;

    render(<TestDriveCard booking={booking} isAdmin />);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });
});
