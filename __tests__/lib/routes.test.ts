import { PROTECTED_ROUTES, ROUTES } from "@/constants/routes";

describe("ROUTES constants", () => {
  it("builds dynamic routes for cars and admin", () => {
    expect(ROUTES.HOME.CAR_DETAILS("123")).toBe("/cars/123");
    expect(ROUTES.TEST_DRIVE("abc")).toBe("/test-drive/abc");
    expect(ROUTES.ADMIN.ADMIN_CAR_EDIT("456")).toBe("/admin/cars/456/edit");
  });

  it("exposes protected routes list", () => {
    expect(PROTECTED_ROUTES).toEqual([
      ROUTES.ADMIN.ADMIN,
      ROUTES.SAVED_CARS,
      ROUTES.RESERVATIONS,
    ]);
  });
});
