import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const makeBuilder = () => {
    const b: Record<string, ReturnType<typeof vi.fn>> = {};
    const chainProxy: any = new Proxy(
      {},
      {
        get(_t, prop: string) {
          // ponytail: must be non-thenable or `await chain` hangs forever
          if (prop === "then") return undefined;
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
    return { b, chainProxy };
  };

  return {
    authGetUser: vi.fn(),
    adminBuilder: makeBuilder(),
    hoursBuilder: makeBuilder(),
    fromMock: vi.fn(() => mocks.adminBuilder.chainProxy),
    revalidatePath: vi.fn(),
  };
});

vi.mock("@/lib/supabase/supabase", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.authGetUser },
    from: mocks.fromMock,
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/arcjet", () => ({ default: {} }));

import { saveWorkingHours } from "@/actions/settings/save-working-hours";
import type { DayOfWeekEnum } from "@/enums/day-of-week";

function relinkDefaults() {
  mocks.authGetUser.mockResolvedValue({
    data: { user: { id: "auth-1" } },
    error: null,
  });
  mocks.adminBuilder.b.select.mockReturnValue(mocks.adminBuilder.chainProxy);
  mocks.adminBuilder.b.eq.mockReturnValue(mocks.adminBuilder.chainProxy);
  mocks.adminBuilder.b.single.mockResolvedValue({
    data: { id: "admin-1", role: "ADMIN" },
    error: null,
  });
  mocks.hoursBuilder.b.delete.mockReturnValue(mocks.hoursBuilder.chainProxy);
  mocks.hoursBuilder.b.eq.mockResolvedValue({ data: null, error: null });
  mocks.hoursBuilder.b.insert.mockResolvedValue({ data: null, error: null });
}

const hour = (day: DayOfWeekEnum) => ({
  dayOfWeek: day,
  openTime: "09:00",
  closeTime: "17:00",
  isClosed: false,
});

describe("saveWorkingHours", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    relinkDefaults();
    mocks.fromMock.mockImplementation((table: string) =>
      table === "User"
        ? mocks.adminBuilder.chainProxy
        : mocks.hoursBuilder.chainProxy,
    );
  });

  it("replaces hours: delete then insert with dealershipId stamped", async () => {
    const result = await saveWorkingHours("d-1", [hour(1), hour(2)]);

    expect(result.success).toBe(true);
    expect(result.data).toContain("updated successfully");
    expect(mocks.fromMock).toHaveBeenCalledWith("WorkingHour");
    expect(mocks.hoursBuilder.b.delete).toHaveBeenCalled();
    expect(mocks.hoursBuilder.b.eq).toHaveBeenCalledWith("dealershipId", "d-1");
    expect(mocks.hoursBuilder.b.insert).toHaveBeenCalledWith([
      expect.objectContaining({ dayOfWeek: 1, dealershipId: "d-1" }),
      expect.objectContaining({ dayOfWeek: 2, dealershipId: "d-1" }),
    ]);
  });

  it("revalidates admin settings and test-drive pages", async () => {
    await saveWorkingHours("d-1", [hour(1)]);

    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      expect.stringContaining("settings"),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/test-drive");
  });

  it("skips insert for empty list but still deletes old rows", async () => {
    const result = await saveWorkingHours("d-1", []);

    expect(result.success).toBe(true);
    expect(mocks.hoursBuilder.b.delete).toHaveBeenCalled();
    expect(mocks.hoursBuilder.b.insert).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated callers", async () => {
    mocks.authGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await saveWorkingHours("d-1", [hour(1)]);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
    expect(mocks.hoursBuilder.b.delete).not.toHaveBeenCalled();
  });

  it("rejects non-admin callers", async () => {
    mocks.adminBuilder.b.single.mockResolvedValue({
      data: { id: "u1", role: "USER" },
      error: null,
    });

    const result = await saveWorkingHours("d-1", [hour(1)]);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized access");
  });

  it("returns error when delete fails and skips insert", async () => {
    mocks.hoursBuilder.b.eq.mockResolvedValueOnce({
      data: null,
      error: { message: "fk violation" },
    });

    const result = await saveWorkingHours("d-1", [hour(1)]);

    expect(result.success).toBe(false);
    // ponytail: supabase errors are plain objects, action maps them to "Unexpected error"
    expect(result.error).toBe("Unexpected error");
    expect(mocks.hoursBuilder.b.insert).not.toHaveBeenCalled();
  });

  it("returns error when insert fails", async () => {
    mocks.hoursBuilder.b.insert.mockResolvedValue({
      data: null,
      error: { message: "insert failed" },
    });

    const result = await saveWorkingHours("d-1", [hour(1)]);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unexpected error");
  });
});
