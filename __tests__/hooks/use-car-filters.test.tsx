import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCarFilters } from "@/hooks/use-car-filters";
import type { CarFiltersData } from "@/types/filters/car-filters-data";

const mockRouterPush = vi.fn();
const mockPathname = "/cars";

let mockParams: Record<string, string> = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(mockParams),
}));

const filters: CarFiltersData = {
  makes: [{ id: "1", name: "Toyota", slug: "toyota" }],
  colors: [{ id: "c1", name: "Red", slug: "red" }],
  bodyTypes: ["SUV"],
  fuelTypes: ["Petrol"],
  transmissions: ["Automatic"],
  priceRange: { min: 5000, max: 100000 },
  mileageRange: { min: 0, max: 200000 },
  ageRange: { min: 0, max: 20 },
};

describe("useCarFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
  });

  it("initialises state from URL params when present", () => {
    mockParams = { make: "toyota", minPrice: "20000" };

    const { result } = renderHook(() => useCarFilters(filters));

    expect(result.current.currentFilters.make).toBe("toyota");
    expect(result.current.currentFilters.priceRange[0]).toBe(20000);
    // maxPrice falls back to the filter range
    expect(result.current.currentFilters.priceRange[1]).toBe(
      filters.priceRange.max,
    );
  });

  it("falls back to filter ranges when no URL params exist", () => {
    const { result } = renderHook(() => useCarFilters(filters));

    expect(result.current.currentFilters.make).toBe("");
    expect(result.current.sortBy).toBe("newest");
    expect(result.current.currentFilters.priceRange).toEqual([5000, 100000]);
    expect(result.current.currentFilters.mileageRange).toEqual([0, 200000]);
    expect(result.current.currentFilters.ageRange).toEqual([0, 20]);
  });

  it("reports zero active filters with a clean URL and default state", () => {
    const { result } = renderHook(() => useCarFilters(filters));

    expect(result.current.activeFilterCount).toBe(0);
  });

  it("counts an active make filter", () => {
    mockParams = { make: "toyota" };
    const { result } = renderHook(() => useCarFilters(filters));

    expect(result.current.activeFilterCount).toBe(1);
  });

  it("counts a narrowed price range as one active filter", () => {
    mockParams = { minPrice: "60000" };
    const { result } = renderHook(() => useCarFilters(filters));

    expect(result.current.activeFilterCount).toBe(1);
  });

  it("counts each distinct active filter separately", () => {
    mockParams = { make: "toyota", color: "red", search: "camry" };
    const { result } = renderHook(() => useCarFilters(filters));

    expect(result.current.activeFilterCount).toBe(3);
  });

  it("applies filters by pushing a query string to router.push", () => {
    mockParams = {};
    const { result } = renderHook(() => useCarFilters(filters));

    act(() => {
      result.current.handleFilterChange("make", "toyota");
      result.current.handleFilterChange("bodyType", "SUV");
    });
    act(() => {
      result.current.applyFilters();
    });

    expect(mockRouterPush).toHaveBeenCalledWith(
      "/cars?make=toyota&bodyType=SUV",
    );
  });

  it("omits params at range defaults and omits sortBy=newest", () => {
    const { result } = renderHook(() => useCarFilters(filters));

    act(() => {
      result.current.handleFilterChange("priceRange", [5000, 100000]);
    });
    act(() => {
      result.current.applyFilters();
    });

    expect(mockRouterPush).toHaveBeenCalledWith("/cars");
  });

  it("swaps inverted price bounds before applying", () => {
    const { result } = renderHook(() => useCarFilters(filters));

    act(() => {
      result.current.handleFilterChange("priceRange", [80000, 30000]);
    });
    act(() => {
      result.current.applyFilters();
    });

    const url = mockRouterPush.mock.calls[0][0] as string;
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("minPrice")).toBe("30000");
    expect(params.get("maxPrice")).toBe("80000");
  });

  it("clamps out-of-range values to the filter ranges", () => {
    const { result } = renderHook(() => useCarFilters(filters));

    act(() => {
      result.current.handleFilterChange("priceRange", [-500, 999999]);
    });
    act(() => {
      result.current.applyFilters();
    });

    expect(mockRouterPush).toHaveBeenCalledWith("/cars");
  });

  it("preserves existing search and page params on apply", () => {
    mockParams = { search: "camry", page: "2" };
    const { result } = renderHook(() => useCarFilters(filters));

    act(() => {
      result.current.handleFilterChange("make", "toyota");
    });
    act(() => {
      result.current.applyFilters();
    });

    const url = mockRouterPush.mock.calls[0][0] as string;
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("search")).toBe("camry");
    expect(params.get("page")).toBe("2");
    expect(params.get("make")).toBe("toyota");
  });

  it("sets non-default sortBy in applied URL", () => {
    const { result } = renderHook(() => useCarFilters(filters));

    act(() => {
      result.current.setSortBy("price-asc");
    });
    act(() => {
      result.current.applyFilters();
    });

    expect(mockRouterPush).toHaveBeenCalledWith("/cars?sortBy=price-asc");
  });

  it("clears filters and pushes bare pathname", () => {
    mockParams = { make: "toyota" };
    const { result } = renderHook(() => useCarFilters(filters));

    act(() => {
      result.current.clearFilters();
    });
    act(() => {
      result.current.applyFilters();
    });

    expect(result.current.activeFilterCount).toBe(0);
    expect(mockRouterPush).toHaveBeenCalledWith("/cars");
  });

  it("opens and closes the mobile sheet", () => {
    const { result } = renderHook(() => useCarFilters(filters));

    expect(result.current.isSheetOpen).toBe(false);

    act(() => {
      result.current.setIsSheetOpen(true);
    });
    expect(result.current.isSheetOpen).toBe(true);

    act(() => {
      result.current.setIsSheetOpen(false);
    });
    expect(result.current.isSheetOpen).toBe(false);
  });
});
