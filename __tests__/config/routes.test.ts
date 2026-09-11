import { describe, expect, it } from "vitest";
import { ROUTES } from "@/config/routes";

describe("ROUTES", () => {
  it("returns static routes", () => {
    expect(ROUTES.HOME.HOME).toBe("/");
    expect(ROUTES.HOME.CARS).toBe("/cars");
    expect(ROUTES.AUTH.SIGN_IN).toBe("/sign-in");
    expect(ROUTES.AUTH.SIGN_UP).toBe("/sign-up");
    expect(ROUTES.SAVED_CARS).toBe("/saved-cars");
    expect(ROUTES.RESERVATIONS).toBe("/reservations");
    expect(ROUTES.ADMIN.ADMIN).toBe("/admin");
    expect(ROUTES.ADMIN.ADMIN_CARS).toBe("/admin/cars");
    expect(ROUTES.ADMIN.ADMIN_CAR_CREATE).toBe("/admin/cars/create");
    expect(ROUTES.ADMIN.ADMIN_SETTINGS).toBe("/admin/settings");
  });

  it("builds dynamic routes", () => {
    expect(ROUTES.HOME.CAR_DETAILS("123")).toBe("/cars/123");
    expect(ROUTES.TEST_DRIVE("abc")).toBe("/test-drive/abc");
    expect(ROUTES.ADMIN.ADMIN_CAR_EDIT("456")).toBe("/admin/cars/456/edit");
  });
});
