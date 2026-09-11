import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdmin } from "@/actions/admin/get-admin";
import { getDashboardData } from "@/actions/admin/get-dashboard-data";
import { UserRoleEnum as UserRole } from "@/enums/user-role";

const mocks = vi.hoisted(() => {
  const makeBuilder = () => {
    const b: Record<string, ReturnType<typeof vi.fn>> = {};
    const chainProxy: any = new Proxy(
      {},
      {
        get(_t, prop: string) {
          if (!b[prop]) b[prop] = vi.fn().mockReturnValue(chainProxy);
          return b[prop];
        },
      },
    );
    for (const key of [
      "select",
      "eq",
      "in",
      "order",
      "limit",
      "range",
      "insert",
      "update",
      "single",
      "maybeSingle",
    ]) {
      b[key] = vi.fn().mockReturnValue(chainProxy);
    }
    return { b, chainProxy };
  };

  const userBuilder = makeBuilder();
  const carBuilder = makeBuilder();
  const testDriveBuilder = makeBuilder();

  return {
    authGetUser: vi.fn(),
    rpc: vi.fn(),
    userBuilder,
    carBuilder,
    testDriveBuilder,
    fromMock: vi.fn((table: string) => {
      if (table === "Car") return carBuilder.chainProxy;
      if (table === "TestDriveBooking") return testDriveBuilder.chainProxy;
      return userBuilder.chainProxy;
    }),
    revalidatePath: vi.fn(),
  };
});

vi.mock("@/lib/supabase/supabase", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.authGetUser },
    from: mocks.fromMock,
    rpc: mocks.rpc,
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/arcjet", () => ({ default: {} }));

function relinkDefaults() {
  // Touch the proxies so lazy mocks exist before configuration
  mocks.userBuilder.chainProxy.single;
  mocks.carBuilder.chainProxy.select;
  mocks.testDriveBuilder.chainProxy.select;
  mocks.authGetUser.mockResolvedValue({
    data: { user: { id: "auth-1" } },
    error: null,
  });
  mocks.userBuilder.b.single.mockResolvedValue({
    data: { id: "user-1", role: UserRole.ADMIN },
    error: null,
  });
  mocks.carBuilder.b.select.mockResolvedValue({
    data: [
      { id: "car-1", status: "AVAILABLE", featured: true },
      { id: "car-2", status: "SOLD", featured: false },
      { id: "car-3", status: "UNAVAILABLE", featured: false },
    ],
    error: null,
  });
  mocks.testDriveBuilder.b.select.mockResolvedValue({
    data: [
      { id: "td-1", status: "PENDING", carId: "car-1" },
      { id: "td-2", status: "COMPLETED", carId: "car-2" },
    ],
    error: null,
  });
}

describe("getAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    relinkDefaults();
  });

  it("throws when unauthenticated", async () => {
    mocks.authGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(getAdmin()).rejects.toThrow("Unauthorized");
  });

  it("denies access when the app user row is missing", async () => {
    mocks.userBuilder.b.single.mockResolvedValue({ data: null, error: null });

    const result = await getAdmin();

    expect(result).toEqual({ authorized: false, reason: "not-admin" });
  });

  it("denies access for non-admin users", async () => {
    mocks.userBuilder.b.single.mockResolvedValue({
      data: { id: "user-1", role: UserRole.USER },
      error: null,
    });

    const result = await getAdmin();

    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("not-admin");
  });

  it("authorizes admins and returns the user row", async () => {
    const result = await getAdmin();

    expect(result.authorized).toBe(true);
    expect(result.user).toMatchObject({ id: "user-1", role: UserRole.ADMIN });
    expect(mocks.userBuilder.b.eq).toHaveBeenCalledWith(
      "supabaseAuthUserId",
      "auth-1",
    );
  });
});

describe("getDashboardData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    relinkDefaults();
  });

  it("returns Unauthorized for non-admin users", async () => {
    mocks.userBuilder.b.single.mockResolvedValue({
      data: { id: "user-1", role: UserRole.USER },
      error: null,
    });

    const result = await getDashboardData();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("aggregates car counts by status and featured flag", async () => {
    const result = await getDashboardData();

    expect(result.success).toBe(true);
    expect(result.data?.cars).toEqual({
      total: 3,
      available: 1,
      sold: 1,
      unavailable: 1,
      featured: 1,
    });
  });

  it("aggregates test drive counts by status", async () => {
    const result = await getDashboardData();

    expect(result.data?.testDrives).toMatchObject({
      total: 2,
      pending: 1,
      completed: 1,
    });
  });

  it("computes conversion rate from completed test drives to sold cars", async () => {
    // car-2 is SOLD and had a COMPLETED test drive → 1/1 = 100%
    const result = await getDashboardData();

    expect(result.data?.testDrives.conversionRate).toBe(100);
  });

  it("returns zero conversion rate when no test drives completed", async () => {
    mocks.testDriveBuilder.b.select.mockResolvedValue({
      data: [],
      error: null,
    });

    const result = await getDashboardData();

    expect(result.data?.testDrives.conversionRate).toBe(0);
  });

  it("queries both Car and TestDriveBooking tables", async () => {
    await getDashboardData();

    expect(mocks.fromMock).toHaveBeenCalledWith("Car");
    expect(mocks.fromMock).toHaveBeenCalledWith("TestDriveBooking");
  });
});
