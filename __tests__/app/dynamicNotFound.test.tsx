import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminCarEditNotFound from "@/app/(admin)/admin/cars/[id]/edit/not-found";
import CarNotFound from "@/app/(main)/cars/[id]/not-found";
import TestDriveNotFound from "@/app/(main)/test-drive/[id]/not-found";
import { ROUTES } from "@/config/routes";

describe("Dynamic Route Not Found Pages", () => {
  describe("CarNotFound (app/(main)/cars/[id]/not-found)", () => {
    it("renders car not found message and action links", () => {
      render(<CarNotFound />);

      expect(
        screen.getByRole("heading", { name: "Car Not Found" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/vehicle you are looking for does not exist/i),
      ).toBeInTheDocument();

      const browseCars = screen.getByRole("link", { name: "Browse All Cars" });
      expect(browseCars).toHaveAttribute("href", ROUTES.HOME.CARS);

      const returnHome = screen.getByRole("link", { name: "Return Home" });
      expect(returnHome).toHaveAttribute("href", ROUTES.HOME.HOME);
    });
  });

  describe("TestDriveNotFound (app/(main)/test-drive/[id]/not-found)", () => {
    it("renders test drive not found message and action links", () => {
      render(<TestDriveNotFound />);

      expect(
        screen.getByRole("heading", { name: "Test Drive Unavailable" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/scheduling a test drive for does not exist/i),
      ).toBeInTheDocument();

      const browseCars = screen.getByRole("link", {
        name: "Browse Available Cars",
      });
      expect(browseCars).toHaveAttribute("href", ROUTES.HOME.CARS);

      const returnHome = screen.getByRole("link", { name: "Return Home" });
      expect(returnHome).toHaveAttribute("href", ROUTES.HOME.HOME);
    });
  });

  describe("AdminCarEditNotFound (app/(admin)/admin/cars/[id]/edit/not-found)", () => {
    it("renders admin car edit not found message and links", () => {
      render(<AdminCarEditNotFound />);

      expect(
        screen.getByRole("heading", { name: "Car Not Found" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/could not be found in the marketplace inventory/i),
      ).toBeInTheDocument();

      const backToCars = screen.getByRole("link", {
        name: "Back to Cars Inventory",
      });
      expect(backToCars).toHaveAttribute("href", ROUTES.ADMIN.ADMIN_CARS);

      const dashboard = screen.getByRole("link", { name: "Admin Dashboard" });
      expect(dashboard).toHaveAttribute("href", ROUTES.ADMIN.ADMIN);
    });
  });
});
