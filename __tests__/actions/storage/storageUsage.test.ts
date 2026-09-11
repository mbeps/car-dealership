import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/supabase", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.authGetUser },
    from: vi.fn(),
    rpc: mocks.rpc,
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/arcjet", () => ({ default: {} }));

import { getStorageUsage } from "@/actions/storage/get-storage-usage";

describe("getStorageUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns total bytes from the RPC", async () => {
    mocks.rpc.mockResolvedValue({ data: 123456, error: null });

    const result = await getStorageUsage();

    expect(result).toBe(123456);
    expect(mocks.rpc).toHaveBeenCalledWith("get_global_storage_usage");
  });

  it("returns 0 when RPC returns null data", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    expect(await getStorageUsage()).toBe(0);
  });

  it("returns 0 when RPC errors", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "function not found" },
    });

    expect(await getStorageUsage()).toBe(0);
  });

  it("returns 0 when the client throws unexpectedly", async () => {
    mocks.rpc.mockRejectedValue(new Error("network down"));

    expect(await getStorageUsage()).toBe(0);
  });
});
