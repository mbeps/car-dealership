import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  type Res = { data?: unknown; error?: unknown };
  const results: Record<string, Res> = {};
  const singleQueues: Record<string, Res[]> = {};
  const maybeQueues: Record<string, Res[]> = {};
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
        "order",
        "limit",
        "range",
        "gte",
        "lte",
        "insert",
        "update",
        "delete",
      ]) {
        b[m] = vi.fn(() => b);
      }
      b.single = vi.fn(
        async () => singleQueues[table]?.shift() ?? { data: null, error: null },
      );
      b.maybeSingle = vi.fn(
        async () => maybeQueues[table]?.shift() ?? { data: null, error: null },
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
  const getUserError: { value: unknown } = { value: null };
  const dbUser: { value: unknown } = { value: { id: "db-user-1" } };
  return {
    results,
    singleQueues,
    maybeQueues,
    builders,
    getBuilder,
    authUser,
    getUserError,
    dbUser,
  };
});

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
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/arcjet", () => ({ default: {} }));
vi.mock("@/actions/cars/get-or-create-db-user", () => ({
  getOrCreateDbUser: vi.fn(async () => h.dbUser.value),
}));

import { revalidatePath } from "next/cache";
import { toggleSavedCar } from "@/actions/cars/toggle-saved-car";

const authUser = { id: "auth-1", email: "a@b.c" };

describe("toggleSavedCar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(h.results)) delete h.results[k];
    for (const k of Object.keys(h.singleQueues)) delete h.singleQueues[k];
    for (const k of Object.keys(h.maybeQueues)) delete h.maybeQueues[k];
    h.authUser.value = authUser;
    h.getUserError.value = null;
    h.dbUser.value = { id: "db-user-1" };
  });

  it("saves a car when not previously saved", async () => {
    h.singleQueues["Car"] = [{ data: { id: "car-1" }, error: null }];
    h.maybeQueues["UserSavedCar"] = [{ data: null, error: null }];

    const res = await toggleSavedCar("car-1");

    expect(res.success).toBe(true);
    expect(res.data).toEqual({
      saved: true,
      message: "Car added to favorites",
    });
    expect(h.builders["UserSavedCar"].insert).toHaveBeenCalledWith({
      userId: "db-user-1",
      carId: "car-1",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/saved-cars");
  });

  it("unsaves a car when already saved", async () => {
    h.singleQueues["Car"] = [{ data: { id: "car-1" }, error: null }];
    h.maybeQueues["UserSavedCar"] = [
      { data: { userId: "db-user-1", carId: "car-1" }, error: null },
    ];

    const res = await toggleSavedCar("car-1");

    expect(res.success).toBe(true);
    expect(res.data).toEqual({
      saved: false,
      message: "Car removed from favorites",
    });
    expect(h.builders["UserSavedCar"].delete).toHaveBeenCalled();
    expect(h.builders["UserSavedCar"].eq).toHaveBeenCalledWith(
      "userId",
      "db-user-1",
    );
    expect(h.builders["UserSavedCar"].eq).toHaveBeenCalledWith(
      "carId",
      "car-1",
    );
    expect(h.builders["UserSavedCar"].insert).not.toHaveBeenCalled();
  });

  it("returns error when car does not exist", async () => {
    h.singleQueues["Car"] = [{ data: null, error: null }];

    const res = await toggleSavedCar("missing");

    expect(res.success).toBe(false);
    expect(res.error).toBe("Car not found");
    expect(h.builders["UserSavedCar"].insert).not.toHaveBeenCalled();
  });

  it("throws when unauthenticated", async () => {
    h.authUser.value = null;

    await expect(toggleSavedCar("car-1")).rejects.toThrow(
      /Error toggling saved car:.*Unauthorized/,
    );
  });

  it("throws when auth lookup errors", async () => {
    h.getUserError.value = { message: "session expired" };

    await expect(toggleSavedCar("car-1")).rejects.toThrow(/Unauthorized/);
  });

  it("throws when insert fails", async () => {
    h.singleQueues["Car"] = [{ data: { id: "car-1" }, error: null }];
    h.maybeQueues["UserSavedCar"] = [{ data: null, error: null }];
    h.results["UserSavedCar"] = {
      data: null,
      error: { message: "insert fail" },
    };

    await expect(toggleSavedCar("car-1")).rejects.toThrow(/insert fail/);
  });

  it("throws when delete of existing save fails", async () => {
    h.singleQueues["Car"] = [{ data: { id: "car-1" }, error: null }];
    h.maybeQueues["UserSavedCar"] = [
      { data: { userId: "db-user-1", carId: "car-1" }, error: null },
    ];
    h.results["UserSavedCar"] = {
      data: null,
      error: { message: "delete fail" },
    };

    await expect(toggleSavedCar("car-1")).rejects.toThrow(/delete fail/);
  });

  it("treats PGRST116 on existing-save lookup as not-saved", async () => {
    h.singleQueues["Car"] = [{ data: { id: "car-1" }, error: null }];
    h.maybeQueues["UserSavedCar"] = [
      { data: null, error: { code: "PGRST116", message: "no rows" } },
    ];

    const res = await toggleSavedCar("car-1");

    expect(res.success).toBe(true);
    expect(res.data?.saved).toBe(true);
  });

  it("throws on non-PGRST116 existing-save lookup errors", async () => {
    h.singleQueues["Car"] = [{ data: { id: "car-1" }, error: null }];
    h.maybeQueues["UserSavedCar"] = [
      { data: null, error: { code: "XX000", message: "connection lost" } },
    ];

    await expect(toggleSavedCar("car-1")).rejects.toThrow(/connection lost/);
  });
});
