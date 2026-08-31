import { beforeEach, describe, expect, it, vi } from "vitest";
import { h } from "./_helpers";

vi.mock("@/lib/supabase/supabase", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: h.authUser.value },
        error: h.getUserError.value,
      }),
    },
    from: (table: string) => h.getBuilder(table),
  }),
  createPublicClient: () => ({
    from: (table: string) => h.getBuilder(table),
  }),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

import { getFeaturedCars } from "@/actions/home/get-featured-cars";

const rawCar = {
  id: "car-1",
  price: "25000",
  mileage: "12000",
  year: "2024",
  seats: "5",
  featured: true,
  status: "AVAILABLE",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
  carMake: { id: "mk-1", name: "Toyota", slug: "toyota" },
  carColor: { id: "cl-1", name: "Red", slug: "red" },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getFeaturedCars", () => {
  it("queries available featured cars with make/color relations, newest first", async () => {
    h.results.Car = { data: [rawCar], error: null };

    const cars = await getFeaturedCars();

    expect(cars).toHaveLength(1);
    const b = h.getBuilder("Car");
    expect(b.select).toHaveBeenCalledWith(
      expect.stringContaining("carMake:CarMake"),
    );
    expect(b.eq).toHaveBeenCalledWith("featured", true);
    expect(b.eq).toHaveBeenCalledWith("status", "AVAILABLE");
    expect(b.order).toHaveBeenCalledWith("createdAt", { ascending: false });
    expect(b.limit).toHaveBeenCalledWith(3);
  });

  it("applies a custom limit", async () => {
    h.results.Car = { data: [], error: null };
    await getFeaturedCars(5);
    expect(h.getBuilder("Car").limit).toHaveBeenCalledWith(5);
  });

  it("serializes numeric strings to numbers and flattens relations", async () => {
    h.results.Car = { data: [rawCar], error: null };

    const [car] = await getFeaturedCars();
    expect(car.price).toBe(25000);
    expect(car.mileage).toBe(12000);
    expect(car.year).toBe(2024);
    expect(car.make).toBe("Toyota");
    expect(car.color).toBe("Red");
  });

  it("returns an empty array when no cars match", async () => {
    h.results.Car = { data: [], error: null };
    expect(await getFeaturedCars()).toEqual([]);
  });

  it("treats null data as empty array", async () => {
    h.results.Car = { data: null, error: null };
    expect(await getFeaturedCars()).toEqual([]);
  });

  it("throws a wrapped error on db failure", async () => {
    h.results.Car = { data: null, error: { message: "db down" } };

    await expect(getFeaturedCars()).rejects.toThrow(
      "Error fetching featured cars:db down",
    );
  });
});
