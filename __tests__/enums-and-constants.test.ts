import { describe, it, expect } from "vitest";

import { BookingStatusEnum } from "@/enums/booking-status";
import { CarStatusEnum } from "@/enums/car-status";
import { DayOfWeekEnum } from "@/enums/day-of-week";
import { UserRoleEnum } from "@/enums/user-role";
import { ROUTES, PROTECTED_ROUTES } from "@/constants/routes";
import { bodyTypes } from "@/constants/body-types";
import { carMakes } from "@/constants/car-makes";
import { DEALERSHIP_NAME } from "@/constants/dealership-name";

describe("enums", () => {
  it("BookingStatusEnum has all five lifecycle states", () => {
    expect(Object.values(BookingStatusEnum)).toEqual([
      "PENDING",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ]);
  });

  it("CarStatusEnum has available/sold/unavailable", () => {
    expect(CarStatusEnum.AVAILABLE).toBe("AVAILABLE");
    expect(CarStatusEnum.SOLD).toBe("SOLD");
    expect(CarStatusEnum.UNAVAILABLE).toBe("UNAVAILABLE");
  });

  it("DayOfWeekEnum covers Monday through Sunday", () => {
    expect(Object.keys(DayOfWeekEnum)).toHaveLength(7);
    expect(DayOfWeekEnum.MONDAY).toBe("MONDAY");
    expect(DayOfWeekEnum.SUNDAY).toBe("SUNDAY");
  });

  it("UserRoleEnum has only ADMIN and USER", () => {
    expect(Object.values(UserRoleEnum).sort()).toEqual(["ADMIN", "USER"]);
  });
});

describe("ROUTES constants", () => {
  it("exposes core public routes", () => {
    expect(ROUTES.HOME.HOME).toBe("/");
    expect(ROUTES.HOME.CARS).toBe("/cars");
    expect(ROUTES.AUTH.SIGN_IN).toBe("/sign-in");
    expect(ROUTES.AUTH.SIGN_UP).toBe("/sign-up");
  });

  it("builds dynamic car details route from car id", () => {
    expect(ROUTES.HOME.CAR_DETAILS("42")).toBe("/cars/42");
  });

  it("builds admin routes under /admin", () => {
    expect(ROUTES.ADMIN.ADMIN_CAR_CREATE).toBe("/admin/cars/create");
    expect(ROUTES.ADMIN.ADMIN_CAR_EDIT("7")).toBe("/admin/cars/7/edit");
    expect(ROUTES.ADMIN.ADMIN_SETTINGS).toBe("/admin/settings");
  });

  it("marks saved cars and reservations as protected", () => {
    expect(PROTECTED_ROUTES).toContain("/saved-cars");
    expect(PROTECTED_ROUTES).toContain("/reservations");
  });
});

describe("static data constants", () => {
  it("bodyTypes contains the four homepage entries with image paths", () => {
    expect(bodyTypes.map((b) => b.name)).toEqual([
      "SUV",
      "Sedan",
      "Hatchback",
      "Coupe",
    ]);
    expect(bodyTypes.every((b) => b.image.startsWith("/body/"))).toBe(true);
  });

  it("carMakes is a non-empty list of unique names", () => {
    expect(carMakes.length).toBeGreaterThan(0);
    expect(new Set(carMakes).size).toBe(carMakes.length);
  });

  it("dealershipName is a non-empty string", () => {
    expect(typeof DEALERSHIP_NAME).toBe("string");
    expect(DEALERSHIP_NAME.length).toBeGreaterThan(0);
  });
});
