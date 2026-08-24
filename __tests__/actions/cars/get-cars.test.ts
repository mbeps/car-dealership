import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  type Res = { data?: unknown; error?: unknown; count?: number };
  const results: Record<string, Res> = {};
  const singleQueues: Record<string, Res[]> = {};
  const builders: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {};
  const getBuilder = (table: string) => {
    if (!builders[table]) {
      const b: Record<string, any> = {};
      for (const m of [
        "select",
        "eq",
        "ilike",
        "in",
        "or",
        "gte",
        "lte",
        "order",
        "range",
      ]) {
        b[m] = vi.fn(() => b);
      }
      b.single = vi.fn(
        async () => singleQueues[table]?.shift() ?? { data: null, error: null },
      );
      Object.defineProperty(b, "then", {
        configurable: true,
        value: (
          onFulfilled: (v: unknown) => unknown,
          onRejected: (e: unknown) => unknown,
        ) =>
          Promise.resolve(results[table] ?? { data: [], error: null }).then(
            onFulfilled,
            onRejected,
          ),
      });
      builders[table] = b;
    }
    return builders[table];
  };
  const authUser: { value: unknown } = { value: null };
  const makeTermIds: { value: string[] } = { value: [] };
  const colorTermIds: { value: string[] } = { value: [] };
  const makeSearchIds: { value: string[] } = { value: [] };
  const colorSearchIds: { value: string[] } = { value: [] };
  const makeSlugId: { value: string | null } = { value: null };
  const colorSlugId: { value: string | null } = { value: null };
  return {
    results,
    singleQueues,
    builders,
    getBuilder,
    authUser,
    makeTermIds,
    colorTermIds,
    makeSearchIds,
    colorSearchIds,
    makeSlugId,
    colorSlugId,
  };
});

vi.mock("@/lib/supabase/supabase", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: h.authUser.value }, error: null }),
    },
    from: (table: string) => h.getBuilder(table),
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/arcjet", () => ({ default: {} }));
vi.mock("@/lib/helpers/serialize-car", () => ({
  serializeCarData: (car: Record<string, unknown>, saved = false) => ({
    ...car,
    isWishlisted: saved,
  }),
}));

// Sibling lookup actions are cross-imported by the units under test.
vi.mock("@/actions/cars/get-make-ids-for-term", () => ({
  getMakeIdsForTerm: vi.fn(async () => h.makeTermIds.value),
}));
vi.mock("@/actions/cars/get-color-ids-for-term", () => ({
  getColorIdsForTerm: vi.fn(async () => h.colorTermIds.value),
}));
vi.mock("@/actions/cars/get-make-ids-for-search", () => ({
  getMakeIdsForSearch: vi.fn(async () => h.makeSearchIds.value),
}));
vi.mock("@/actions/cars/get-color-ids-for-search", () => ({
  getColorIdsForSearch: vi.fn(async () => h.colorSearchIds.value),
}));
vi.mock("@/actions/cars/get-make-id-by-slug", () => ({
  getMakeIdBySlug: vi.fn(async () => h.makeSlugId.value),
}));
vi.mock("@/actions/cars/get-color-id-by-slug", () => ({
  getColorIdBySlug: vi.fn(async () => h.colorSlugId.value),
}));

import { getCars } from "@/actions/cars/get-cars";
import { getCars as getPublicCars } from "@/actions/cars/get-public-cars";

describe("getCars (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(h.results)) delete h.results[k];
    for (const k of Object.keys(h.singleQueues)) delete h.singleQueues[k];
    h.authUser.value = null;
    h.makeTermIds.value = [];
    h.colorTermIds.value = [];
  });

  it("returns serialized cars sorted newest first without search", async () => {
    h.results["Car"] = { data: [{ id: "c1" }, { id: "c2" }], error: null };

    const res = await getCars();

    expect(res.success).toBe(true);
    expect(res.data).toEqual([
      { id: "c1", isWishlisted: false },
      { id: "c2", isWishlisted: false },
    ]);
    expect(h.builders["Car"].select).toHaveBeenCalledWith(
      expect.stringContaining("carMake"),
    );
    expect(h.builders["Car"].order).toHaveBeenCalledWith("createdAt", {
      ascending: false,
    });
    expect(h.builders["Car"].or).not.toHaveBeenCalled();
  });

  it("builds an .or clause including model/description/plate and matched ids when searching", async () => {
    h.makeTermIds.value = ["make-9"];
    h.colorTermIds.value = ["color-7"];

    await getCars("blue");

    expect(h.builders["Car"].or).toHaveBeenCalledWith(
      [
        "model.ilike.%blue%",
        "description.ilike.%blue%",
        "numberPlate.ilike.%blue%",
        "carMakeId.eq.make-9",
        "carColorId.eq.color-7",
      ].join(","),
    );
  });

  it("returns empty list when query errors", async () => {
    h.results["Car"] = { data: null, error: { message: "denied" } };

    const res = await getCars();

    expect(res.success).toBe(false);
    expect(res.error).toContain("denied");
  });
});

describe("getPublicCars", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(h.results)) delete h.results[k];
    for (const k of Object.keys(h.singleQueues)) delete h.singleQueues[k];
    h.authUser.value = null;
    h.makeSlugId.value = null;
    h.colorSlugId.value = null;
    h.makeSearchIds.value = [];
    h.colorSearchIds.value = [];
  });

  it("filters AVAILABLE cars with pagination and default sort", async () => {
    h.results["Car"] = { data: [{ id: "p1" }], error: null, count: 11 };

    const res = await getPublicCars();

    expect(res.success).toBe(true);
    expect(res.data?.pagination).toEqual({
      total: 11,
      page: 1,
      limit: 6,
      pages: 2,
    });
    expect(h.builders["Car"].eq).toHaveBeenCalledWith("status", "AVAILABLE");
    expect(h.builders["Car"].range).toHaveBeenCalledWith(0, 5);
    expect(h.builders["Car"].order).toHaveBeenCalledWith("createdAt", {
      ascending: false,
    });
    expect(h.builders["Car"].select).toHaveBeenCalledWith(expect.anything(), {
      count: "exact",
    });
  });

  it("translates slug filters to id equality filters", async () => {
    h.makeSlugId.value = "make-1";
    h.colorSlugId.value = "color-2";

    await getPublicCars({ make: "bmw", color: "red" });

    expect(h.builders["Car"].eq).toHaveBeenCalledWith("carMakeId", "make-1");
    expect(h.builders["Car"].eq).toHaveBeenCalledWith("carColorId", "color-2");
  });

  it("returns empty result when slug filter matches nothing", async () => {
    const res = await getPublicCars({ make: "ghost" });

    expect(res.success).toBe(true);
    expect(res.data?.cars).toEqual([]);
    expect(res.data?.pagination.total).toBe(0);
    expect(h.builders["Car"].select).not.toHaveBeenCalled();
  });

  it("adds search clauses incl. matched make/color ids when searching", async () => {
    h.makeSearchIds.value = ["m-1"];
    h.colorSearchIds.value = ["c-1"];

    await getPublicCars({ search: "tesla" });

    expect(h.builders["Car"].or).toHaveBeenCalledWith(
      [
        "model.ilike.%tesla%",
        "description.ilike.%tesla%",
        "bodyType.ilike.%tesla%",
        "numberPlate.ilike.%tesla%",
        "carMakeId.eq.m-1",
        "carColorId.eq.c-1",
      ].join(","),
    );
  });

  it("applies price/mileage bounds only when finite", async () => {
    await getPublicCars({ minPrice: 1000, maxPrice: 50000, minMileage: 10 });

    expect(h.builders["Car"].gte).toHaveBeenCalledWith("price", 1000);
    expect(h.builders["Car"].lte).toHaveBeenCalledWith("price", 50000);
    expect(h.builders["Car"].gte).toHaveBeenCalledWith("mileage", 10);
    // maxMileage defaults to MAX_SAFE_INTEGER -> no upper bound applied
    expect(h.builders["Car"].lte).not.toHaveBeenCalledWith(
      "mileage",
      Number.MAX_SAFE_INTEGER,
    );
  });

  it("applies age range as year bounds", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01"));
    try {
      await getPublicCars({ minAge: 1, maxAge: 5 });

      expect(h.builders["Car"].lte).toHaveBeenCalledWith("year", 2025);
      expect(h.builders["Car"].gte).toHaveBeenCalledWith("year", 2021);
    } finally {
      vi.useRealTimers();
    }
  });

  it("sorts by price ascending when requested", async () => {
    await getPublicCars({ sortBy: "priceAsc" });

    expect(h.builders["Car"].order).toHaveBeenCalledWith("price", {
      ascending: true,
    });
  });

  it("paginates to the requested page", async () => {
    await getPublicCars({ page: 3, limit: 6 });

    expect(h.builders["Car"].range).toHaveBeenCalledWith(12, 17);
  });

  it("flags wishlisted cars for authenticated users", async () => {
    h.authUser.value = { id: "auth-1" };
    h.singleQueues["User"] = [{ data: { id: "db-1" }, error: null }];
    h.results["UserSavedCar"] = {
      data: [{ carId: "p1" }],
      error: null,
    };
    h.results["Car"] = {
      data: [{ id: "p1" }, { id: "p2" }],
      error: null,
      count: 2,
    };

    const res = await getPublicCars();

    expect(res.data?.cars[0]).toMatchObject({ id: "p1", isWishlisted: true });
    expect(res.data?.cars[1]).toMatchObject({ id: "p2", isWishlisted: false });
    expect(h.builders["UserSavedCar"].eq).toHaveBeenCalledWith(
      "userId",
      "db-1",
    );
  });

  it("throws on query error", async () => {
    h.results["Car"] = { data: null, error: { message: "boom" }, count: 0 };

    await expect(getPublicCars()).rejects.toThrow(/Error fetching cars:.*boom/);
  });

  it("applies bodyType/fuelType/transmission ilike filters", async () => {
    await getPublicCars({
      bodyType: "SUV",
      fuelType: "Electric",
      transmission: "Automatic",
    });

    expect(h.builders["Car"].ilike).toHaveBeenCalledWith("bodyType", "SUV");
    expect(h.builders["Car"].ilike).toHaveBeenCalledWith(
      "fuelType",
      "Electric",
    );
    expect(h.builders["Car"].ilike).toHaveBeenCalledWith(
      "transmission",
      "Automatic",
    );
  });
});
