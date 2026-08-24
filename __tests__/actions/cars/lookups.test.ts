import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  type Res = { data?: unknown; error?: unknown };
  const results: Record<string, Res> = {};
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
      ]) {
        b[m] = vi.fn(() => b);
      }
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
  return { results, maybeQueues, builders, getBuilder };
});

vi.mock("@/lib/supabase/supabase", () => ({
  createClient: async () => ({
    from: (table: string) => h.getBuilder(table),
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/arcjet", () => ({ default: {} }));

import { getColorIdBySlug } from "@/actions/cars/get-color-id-by-slug";
import { getMakeIdBySlug } from "@/actions/cars/get-make-id-by-slug";
import { getColorIdsForTerm } from "@/actions/cars/get-color-ids-for-term";
import { getMakeIdsForTerm } from "@/actions/cars/get-make-ids-for-term";
import { getColorIdsForSearch } from "@/actions/cars/get-color-ids-for-search";
import { getMakeIdsForSearch } from "@/actions/cars/get-make-ids-for-search";
import { getCarMakes } from "@/actions/cars/get-car-makes";
import { getCarColors } from "@/actions/cars/get-car-colors";

/** Minimal mock Supabase client wired to the shared builders. */
const mockClient = {
  from: (table: string) => h.getBuilder(table),
} as never;

describe("id-by-slug lookups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(h.results)) delete h.results[k];
    for (const k of Object.keys(h.maybeQueues)) delete h.maybeQueues[k];
  });

  it.each([
    ["make", "CarMake"],
    ["color", "CarColor"],
  ] as const)("resolves %s slug to id", async (kind, table) => {
    h.maybeQueues[table] = [{ data: { id: `${kind}-1` }, error: null }];
    const fn = kind === "make" ? getMakeIdBySlug : getColorIdBySlug;

    const id = await fn(mockClient, "red");

    expect(id).toBe(`${kind}-1`);
    expect(h.builders[table].eq).toHaveBeenCalledWith("slug", "red");
  });

  it.each([getMakeIdBySlug, getColorIdBySlug])(
    "returns null without querying when slug is empty (%#)",
    async (fn) => {
      expect(await fn(mockClient, "")).toBeNull();
      expect(h.builders["CarMake"].select).not.toHaveBeenCalled();
      expect(h.builders["CarColor"].select).not.toHaveBeenCalled();
    },
  );

  it.each([getMakeIdBySlug, getColorIdBySlug])(
    "returns null when no row matches (%#)",
    async (fn) => {
      expect(await fn(mockClient, "ghost")).toBeNull();
    },
  );

  it.each([getMakeIdBySlug, getColorIdBySlug])(
    "throws on non-PGRST116 errors (%#)",
    async (fn) => {
      h.maybeQueues["CarMake"] = [
        { data: null, error: { code: "XX000", message: "boom" } },
      ];
      h.maybeQueues["CarColor"] = [
        { data: null, error: { code: "XX000", message: "boom" } },
      ];
      await expect(fn(mockClient, "x")).rejects.toMatchObject({
        code: "XX000",
      });
    },
  );

  it.each([getMakeIdBySlug, getColorIdBySlug])(
    "swallows PGRST116 errors and returns null (%#)",
    async (fn) => {
      h.maybeQueues["CarMake"] = [
        { data: null, error: { code: "PGRST116", message: "no rows" } },
      ];
      h.maybeQueues["CarColor"] = [
        { data: null, error: { code: "PGRST116", message: "no rows" } },
      ];
      expect(await fn(mockClient, "x")).toBeNull();
    },
  );
});

describe("ids-for-term / ids-for-search lookups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(h.results)) delete h.results[k];
  });

  it.each([
    ["make", "CarMake", getMakeIdsForTerm],
    ["color", "CarColor", getColorIdsForTerm],
    ["make-search", "CarMake", getMakeIdsForSearch],
    ["color-search", "CarColor", getColorIdsForSearch],
  ] as const)(
    "maps %s rows to ids via ilike on %s",
    async (_label, table, fn) => {
      h.results[table] = {
        data: [{ id: "a" }, { id: "b" }],
        error: null,
      };

      const ids = await fn(mockClient, "bmw");

      expect(ids).toEqual(["a", "b"]);
      expect(h.builders[table].ilike).toHaveBeenCalledWith("name", "%bmw%");
    },
  );

  it.each([
    getMakeIdsForTerm,
    getColorIdsForTerm,
    getMakeIdsForSearch,
    getColorIdsForSearch,
  ])("returns [] without querying when term is empty (%#)", async (fn) => {
    expect(await fn(mockClient, "")).toEqual([]);
    expect(h.builders["CarMake"].select).not.toHaveBeenCalled();
  });

  it.each([
    getMakeIdsForTerm,
    getColorIdsForTerm,
    getMakeIdsForSearch,
    getColorIdsForSearch,
  ])("returns [] when query yields no rows (%#)", async (fn) => {
    expect(await fn(mockClient, "nothing")).toEqual([]);
  });

  it.each([
    getMakeIdsForTerm,
    getColorIdsForTerm,
    getMakeIdsForSearch,
    getColorIdsForSearch,
  ])("throws when the query errors (%#)", async (fn) => {
    h.results["CarMake"] = { data: null, error: { message: "db down" } };
    h.results["CarColor"] = { data: null, error: { message: "db down" } };
    await expect(fn(mockClient, "x")).rejects.toMatchObject({
      message: "db down",
    });
  });
});

describe("option list actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(h.results)) delete h.results[k];
  });

  it("lists makes sorted by name", async () => {
    h.results["CarMake"] = {
      data: [{ id: "m1", name: "BMW", slug: "bmw", country: "Germany" }],
      error: null,
    };

    const res = await getCarMakes();

    expect(res.success).toBe(true);
    expect(res.data).toEqual([
      { id: "m1", name: "BMW", slug: "bmw", country: "Germany" },
    ]);
    expect(h.builders["CarMake"].order).toHaveBeenCalledWith("name", {
      ascending: true,
    });
  });

  it("lists colors sorted by name", async () => {
    h.results["CarColor"] = {
      data: [{ id: "c1", name: "Red", slug: "red" }],
      error: null,
    };

    const res = await getCarColors();

    expect(res.success).toBe(true);
    expect(res.data).toEqual([{ id: "c1", name: "Red", slug: "red" }]);
    expect(h.builders["CarColor"].order).toHaveBeenCalledWith("name", {
      ascending: true,
    });
  });

  it("returns empty list when no makes exist", async () => {
    const res = await getCarMakes();

    expect(res.success).toBe(true);
    expect(res.data).toEqual([]);
  });

  it("returns error result when make query fails", async () => {
    h.results["CarMake"] = { data: null, error: { message: "denied" } };

    const res = await getCarMakes();

    expect(res.success).toBe(false);
    expect(res.error).toContain("denied");
  });
});
