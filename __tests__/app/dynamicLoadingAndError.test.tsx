import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminError from "@/app/(admin)/admin/error";
import AdminLoading from "@/app/(admin)/admin/loading";
import CarDetailsError from "@/app/(main)/cars/[id]/error";
import CarDetailsLoading from "@/app/(main)/cars/[id]/loading";
import CarsLoading from "@/app/(main)/cars/loading";
import TestDriveError from "@/app/(main)/test-drive/[id]/error";
import TestDriveLoading from "@/app/(main)/test-drive/[id]/loading";
import { ROUTES } from "@/config/routes";

describe("Dynamic Route Loading & Error Components", () => {
  describe("Car Details (loading & error)", () => {
    it("renders car details loading skeleton elements", () => {
      const { container } = render(<CarDetailsLoading />);
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("renders car details error boundary and handles reset", () => {
      const mockReset = vi.fn();
      render(
        <CarDetailsError
          error={new Error("Car load failure")}
          reset={mockReset}
        />,
      );

      expect(
        screen.getByRole("heading", { name: /failed to load car details/i }),
      ).toBeInTheDocument();

      const tryAgain = screen.getByRole("button", { name: /try again/i });
      fireEvent.click(tryAgain);
      expect(mockReset).toHaveBeenCalledTimes(1);

      const browseCars = screen.getByRole("link", { name: /browse all cars/i });
      expect(browseCars).toHaveAttribute("href", ROUTES.HOME.CARS);
    });
  });

  describe("Test Drive (loading & error)", () => {
    it("renders test drive loading skeleton elements", () => {
      const { container } = render(<TestDriveLoading />);
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("renders test drive error boundary and handles reset", () => {
      const mockReset = vi.fn();
      render(
        <TestDriveError
          error={new Error("Test drive failure")}
          reset={mockReset}
        />,
      );

      expect(
        screen.getByRole("heading", { name: /unable to load booking/i }),
      ).toBeInTheDocument();

      const tryAgain = screen.getByRole("button", { name: /try again/i });
      fireEvent.click(tryAgain);
      expect(mockReset).toHaveBeenCalledTimes(1);

      const browseCars = screen.getByRole("link", {
        name: /browse available cars/i,
      });
      expect(browseCars).toHaveAttribute("href", ROUTES.HOME.CARS);
    });
  });

  describe("Cars catalog loading", () => {
    it("renders inventory catalog loading skeleton", () => {
      const { container } = render(<CarsLoading />);
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Admin section (loading & error)", () => {
    it("renders admin loading skeleton elements", () => {
      const { container } = render(<AdminLoading />);
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("renders admin error boundary and handles reset", () => {
      const mockReset = vi.fn();
      render(
        <AdminError error={new Error("Admin failure")} reset={mockReset} />,
      );

      expect(
        screen.getByRole("heading", { name: /admin portal error/i }),
      ).toBeInTheDocument();

      const tryAgain = screen.getByRole("button", { name: /try again/i });
      fireEvent.click(tryAgain);
      expect(mockReset).toHaveBeenCalledTimes(1);

      const dashboard = screen.getByRole("link", { name: /admin dashboard/i });
      expect(dashboard).toHaveAttribute("href", ROUTES.ADMIN.ADMIN);
    });
  });
});
