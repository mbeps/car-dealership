import {
  ROUTES,
  PROTECTED_ROUTES,
  createCarSearchUrl,
  createSignInRedirect,
} from "@/constants/routes";

describe("createSignInRedirect", () => {
  it("returns sign-in path with encoded redirect", () => {
    const redirect = "/cars/abc?make=tesla&featured=true";
    const url = createSignInRedirect(redirect);

    expect(url).toBe(
      `${ROUTES.AUTH.SIGN_IN}?redirect=${encodeURIComponent(redirect)}`,
    );
  });
});

describe("createCarSearchUrl", () => {
  it("builds query string with only truthy values", () => {
    const url = createCarSearchUrl({
      search: "model s",
      make: "tesla",
      bodyType: "",
      fuelType: undefined,
    });

    expect(url).toBe(`${ROUTES.HOME.CARS}?search=model+s&make=tesla`);
  });

  it("returns base cars route when params are empty", () => {
    expect(createCarSearchUrl({})).toBe(ROUTES.HOME.CARS);
  });
});

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
