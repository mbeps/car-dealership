import { ROUTES } from "@/config/routes";
import { createCarSearchUrl } from "@/lib/route/create-car-search-url";

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
