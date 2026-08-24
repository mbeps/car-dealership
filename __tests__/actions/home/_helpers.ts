import { beforeEach } from "vitest";

/**
 * Shared chainable Supabase builder mock for actions/home tests.
 * One builder per table so call assertions never mix tables.
 * ponytail: not vi.hoisted because it must be exported; test files must
 * import this module FIRST so `h` exists before mock factories run.
 */
export const h = (() => {
  type Res = { data?: unknown; error?: unknown };
  const results: Record<string, Res> = {};
  const singleQueues: Record<string, Res[]> = {};
  const builders: Record<string, Record<string, any>> = {};
  const getBuilder = (table: string) => {
    if (!builders[table]) {
      const b: Record<string, any> = {};
      for (const m of [
        "select",
        "eq",
        "order",
        "limit",
        "insert",
        "update",
        "delete",
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
  return {
    results,
    singleQueues,
    builders,
    getBuilder,
    authUser: { value: null as unknown },
    getUserError: { value: null as unknown },
  };
})();

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
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/arcjet", () => ({ default: {} }));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_SUPABASE_URL: "https://sup.example.com" },
}));

export function setupAdmin() {
  h.authUser.value = { id: "auth-1" };
  h.getUserError.value = null;
  h.singleQueues["User"] = [{ data: { role: "ADMIN" }, error: null }];
}

export function setupNonAdmin() {
  h.authUser.value = { id: "auth-2" };
  h.getUserError.value = null;
  h.singleQueues["User"] = [{ data: { role: "USER" }, error: null }];
}

export function setupNoUser() {
  h.authUser.value = null;
  h.getUserError.value = null;
}

export const adminUserRow = { id: "db-1", role: "ADMIN" };

beforeEach(() => {
  vi.clearAllMocks();
  h.authUser.value = null;
  h.getUserError.value = null;
});
