import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  // Real Error instances so actions' `error instanceof Error` branch
  // surfaces .message instead of "Unexpected error".
  const dbErr = (message: string, code = "XX000") =>
    Object.assign(new Error(message), { code });

  const makeBuilder = () => {
    const b: Record<string, ReturnType<typeof vi.fn>> = {};
    const chainProxy: any = new Proxy(
      {},
      {
        get(_t, prop: string) {
          if (prop === "then") {
            // Awaited chains without a terminal mock resolve to a clean
            // success result instead of the proxy itself (whose .error
            // would be a truthy mock fn).
            return (res: (v: unknown) => void) =>
              res({ data: null, error: null });
          }
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
      "delete",
      "single",
      "maybeSingle",
    ]) {
      b[key] = vi.fn().mockReturnValue(chainProxy);
    }
    return { b, chainProxy, dbErr };
  };

  return {
    authGetUser: vi.fn(),
    adminBuilder: makeBuilder(),
    dealershipBuilder: makeBuilder(),
    fromMock: vi.fn(),
    revalidatePath: vi.fn(),
    revalidateBrandingPages: vi.fn(),
  };
});

vi.mock("@/lib/supabase/supabase", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.authGetUser },
    from: mocks.fromMock,
    rpc: vi.fn(),
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/arcjet", () => ({ default: {} }));
vi.mock("@/lib/helpers/branding-cache", () => ({
  revalidateBrandingPages: mocks.revalidateBrandingPages,
}));

import { getDealershipInfo } from "@/actions/settings/get-dealership-info";
import { saveWorkingHours } from "@/actions/settings/save-working-hours";
import { updateDealershipInfo } from "@/actions/settings/update-dealership-info";

function relinkDefaults() {
  // Route by table: "User" → admin builder, everything else → dealership
  mocks.fromMock.mockImplementation((table: string) =>
    table === "User"
      ? mocks.adminBuilder.chainProxy
      : mocks.dealershipBuilder.chainProxy,
  );
  mocks.authGetUser.mockResolvedValue({
    data: { user: { id: "auth-1" } },
    error: null,
  });
  // ensureAdminUser path
  mocks.adminBuilder.b.select.mockReturnValue(mocks.adminBuilder.chainProxy);
  mocks.adminBuilder.b.eq.mockReturnValue(mocks.adminBuilder.chainProxy);
  mocks.adminBuilder.b.single.mockResolvedValue({
    data: { id: "admin-1", role: "ADMIN" },
    error: null,
  });
  // DealershipInfo chains default to dedicated builder
  mocks.dealershipBuilder.b.select.mockReturnValue(
    mocks.dealershipBuilder.chainProxy,
  );
  mocks.dealershipBuilder.b.eq.mockReturnValue(
    mocks.dealershipBuilder.chainProxy,
  );
  mocks.dealershipBuilder.b.single.mockResolvedValue({
    data: { id: "d-1", name: "Test Motors" },
    error: null,
  });
  mocks.dealershipBuilder.b.update.mockReturnValue(
    mocks.dealershipBuilder.chainProxy,
  );
}

const validInfo = {
  name: "Prime Motors",
  address: "1 Main St",
  email: "info@prime.test",
  phone: "+1234567890",
  whatsappPhone: "+1234567890",
};

describe("getDealershipInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    relinkDefaults();
  });

  it("returns dealership info with nested working hours", async () => {
    const record = { id: "d-1", name: "Test Motors", workingHours: [] };
    mocks.dealershipBuilder.b.single.mockResolvedValue({
      data: record,
      error: null,
    });

    const result = await getDealershipInfo();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(record);
    expect(mocks.fromMock).toHaveBeenCalledWith("DealershipInfo");
    expect(mocks.dealershipBuilder.b.select).toHaveBeenCalledWith(
      expect.stringContaining("workingHours"),
    );
    expect(mocks.dealershipBuilder.b.single).toHaveBeenCalled();
  });

  it("returns null data when no rows exist (PGRST116)", async () => {
    mocks.dealershipBuilder.b.single.mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "no rows" },
    });

    const result = await getDealershipInfo();

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  it("returns failure on unexpected db error", async () => {
    mocks.dealershipBuilder.b.single.mockResolvedValue({
      data: null,
      error: mocks.dealershipBuilder.dbErr("connection lost"),
    });

    const result = await getDealershipInfo();

    expect(result.success).toBe(false);
    expect(result.error).toBe("connection lost");
  });
});

describe("updateDealershipInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    relinkDefaults();
    mocks.fromMock.mockImplementation((table: string) =>
      table === "User"
        ? mocks.adminBuilder.chainProxy
        : mocks.dealershipBuilder.chainProxy,
    );
  });

  it("updates contact info for an admin", async () => {
    mocks.dealershipBuilder.b.eq.mockResolvedValue({ data: null, error: null });

    const result = await updateDealershipInfo("d-1", validInfo);

    expect(result.success).toBe(true);
    expect(result.data).toContain("updated successfully");
    expect(mocks.dealershipBuilder.b.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Prime Motors",
        address: "1 Main St",
        whatsappPhone: "+1234567890",
      }),
    );
    expect(mocks.dealershipBuilder.b.eq).toHaveBeenCalledWith("id", "d-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/test-drive");
    expect(mocks.revalidateBrandingPages).toHaveBeenCalled();
  });

  it("rejects non-admin callers", async () => {
    mocks.adminBuilder.b.single.mockResolvedValue({
      data: { id: "u1", role: "USER" },
      error: null,
    });

    const result = await updateDealershipInfo("d-1", validInfo);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized access");
    expect(mocks.dealershipBuilder.b.update).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated callers", async () => {
    mocks.authGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await updateDealershipInfo("d-1", validInfo);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("fails validation for invalid email", async () => {
    const result = await updateDealershipInfo("d-1", {
      ...validInfo,
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
    expect(mocks.dealershipBuilder.b.update).not.toHaveBeenCalled();
  });

  it("returns error when db update fails", async () => {
    mocks.dealershipBuilder.b.eq.mockResolvedValue({
      data: null,
      error: mocks.dealershipBuilder.dbErr("update failed"),
    });

    const result = await updateDealershipInfo("d-1", validInfo);

    expect(result.success).toBe(false);
    expect(result.error).toBe("update failed");
  });
});

describe("saveWorkingHours", () => {
  const hours = [
    { dayOfWeek: 1, openTime: "09:00", closeTime: "17:00", isClosed: false },
    { dayOfWeek: 2, openTime: "09:00", closeTime: "17:00", isClosed: false },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    relinkDefaults();
    mocks.fromMock.mockImplementation((table: string) =>
      table === "User"
        ? mocks.adminBuilder.chainProxy
        : mocks.dealershipBuilder.chainProxy,
    );
    mocks.dealershipBuilder.b.delete.mockReturnValue(
      mocks.dealershipBuilder.chainProxy,
    );
    mocks.dealershipBuilder.b.insert.mockResolvedValue({
      data: null,
      error: null,
    });
  });

  it("deletes existing hours then inserts new ones tagged with dealershipId", async () => {
    const result = await saveWorkingHours("d-1", hours);

    expect(result.success).toBe(true);
    expect(mocks.fromMock).toHaveBeenCalledWith("WorkingHour");
    expect(mocks.dealershipBuilder.b.delete).toHaveBeenCalled();
    expect(mocks.dealershipBuilder.b.eq).toHaveBeenCalledWith(
      "dealershipId",
      "d-1",
    );
    expect(mocks.dealershipBuilder.b.insert).toHaveBeenCalledWith([
      expect.objectContaining({ ...hours[0], dealershipId: "d-1" }),
      expect.objectContaining({ ...hours[1], dealershipId: "d-1" }),
    ]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/test-drive");
  });

  it("skips insert when list is empty but still deletes", async () => {
    const result = await saveWorkingHours("d-1", []);

    expect(result.success).toBe(true);
    expect(mocks.dealershipBuilder.b.delete).toHaveBeenCalled();
    expect(mocks.dealershipBuilder.b.insert).not.toHaveBeenCalled();
  });

  it("rejects non-admin callers", async () => {
    mocks.adminBuilder.b.single.mockResolvedValue({
      data: { id: "u1", role: "USER" },
      error: null,
    });

    const result = await saveWorkingHours("d-1", hours);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized access");
    expect(mocks.dealershipBuilder.b.delete).not.toHaveBeenCalled();
  });

  it("returns error when delete fails", async () => {
    mocks.dealershipBuilder.b.eq.mockResolvedValueOnce({
      data: null,
      error: mocks.dealershipBuilder.dbErr("delete blocked"),
    });

    const result = await saveWorkingHours("d-1", hours);

    expect(result.success).toBe(false);
    expect(result.error).toBe("delete blocked");
    expect(mocks.dealershipBuilder.b.insert).not.toHaveBeenCalled();
  });

  it("returns error when insert fails", async () => {
    mocks.dealershipBuilder.b.insert.mockResolvedValue({
      data: null,
      error: mocks.dealershipBuilder.dbErr("insert failed"),
    });

    const result = await saveWorkingHours("d-1", hours);

    expect(result.success).toBe(false);
    expect(result.error).toBe("insert failed");
  });
});
