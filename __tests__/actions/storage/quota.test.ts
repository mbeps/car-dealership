import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  rpc: vi.fn(),
  fromMock: vi.fn(),
  revalidatePath: vi.fn(),
}));

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

import { checkStorageQuota } from "@/actions/storage/check-storage-quota";
import { getStorageUsage } from "@/actions/storage/get-storage-usage";

describe("getStorageUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the RPC value in bytes", async () => {
    mocks.rpc.mockResolvedValue({ data: 1024, error: null });

    const usage = await getStorageUsage();

    expect(usage).toBe(1024);
    expect(mocks.rpc).toHaveBeenCalledWith("get_global_storage_usage");
  });

  it("returns 0 when the RPC errors", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    expect(await getStorageUsage()).toBe(0);
  });

  it("returns 0 for a null RPC result", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    expect(await getStorageUsage()).toBe(0);
  });

  it("returns 0 when the client throws", async () => {
    mocks.rpc.mockRejectedValue(new Error("network"));

    expect(await getStorageUsage()).toBe(0);
  });
});

describe("checkStorageQuota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows usage below the limit (50 GB default)", async () => {
    mocks.rpc.mockResolvedValue({
      data: 10 * 1024 * 1024 * 1024,
      error: null,
    });

    const result = await checkStorageQuota();

    expect(result.allowed).toBe(true);
    expect(result.usageBytes).toBe(10 * 1024 * 1024 * 1024);
    expect(result.limitBytes).toBe(50 * 1024 * 1024 * 1024);
  });

  it("allows usage exactly at the limit", async () => {
    mocks.rpc.mockResolvedValue({
      data: 50 * 1024 * 1024 * 1024,
      error: null,
    });

    const result = await checkStorageQuota();

    expect(result.allowed).toBe(true);
  });

  it("denies usage above the limit", async () => {
    mocks.rpc.mockResolvedValue({
      data: 51 * 1024 * 1024 * 1024,
      error: null,
    });

    const result = await checkStorageQuota();

    expect(result.allowed).toBe(false);
  });

  it("factors incoming bytes into the allowance decision", async () => {
    mocks.rpc.mockResolvedValue({
      data: 49.9 * 1024 * 1024 * 1024,
      error: null,
    });

    const fits = await checkStorageQuota(1 * 1024 * 1024); // small upload → ok
    const overflows = await checkStorageQuota(200 * 1024 * 1024 * 1024);

    expect(fits.allowed).toBe(true);
    expect(overflows.allowed).toBe(false);
  });

  it("treats failed usage fetch as zero and allows the request", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    const result = await checkStorageQuota(100);

    expect(result.usageBytes).toBe(0);
    expect(result.allowed).toBe(true);
  });
});
