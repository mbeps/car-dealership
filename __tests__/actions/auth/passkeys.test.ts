import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  passkeyList: vi.fn(),
  passkeyDelete: vi.fn(),
}));

vi.mock("@/lib/supabase/supabase", () => ({
  createClient: async () => ({
    auth: {
      passkey: {
        list: mocks.passkeyList,
        delete: mocks.passkeyDelete,
      },
    },
  }),
}));

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/arcjet", () => ({ default: {} }));

import { deleteUserPasskey } from "@/actions/auth/delete-user-passkey";
import { listUserPasskeys } from "@/actions/auth/list-user-passkeys";

describe("listUserPasskeys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the passkey list on success", async () => {
    const passkeys = [{ id: "pk1" }, { id: "pk2" }];
    mocks.passkeyList.mockResolvedValue({ data: passkeys, error: null });

    const res = await listUserPasskeys();

    expect(res).toEqual({ success: true, data: passkeys });
    expect(mocks.passkeyList).toHaveBeenCalledTimes(1);
  });

  it("normalises null data to an empty array", async () => {
    mocks.passkeyList.mockResolvedValue({ data: null, error: null });

    const res = await listUserPasskeys();

    expect(res).toEqual({ success: true, data: [] });
  });

  it("returns failure with the supabase error message", async () => {
    mocks.passkeyList.mockResolvedValue({
      data: null,
      error: { message: "passkey listing denied" },
    });

    const res = await listUserPasskeys();

    expect(res).toEqual({
      success: false,
      error: "passkey listing denied",
    });
  });

  it("catches thrown errors and returns failure", async () => {
    mocks.passkeyList.mockRejectedValue(new Error("network down"));

    const res = await listUserPasskeys();

    expect(res.success).toBe(false);
    expect(res.error).toBe("network down");
  });
});

describe("deleteUserPasskey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes by passkey id and returns success", async () => {
    mocks.passkeyDelete.mockResolvedValue({ error: null });

    const res = await deleteUserPasskey("pk-123");

    expect(res).toEqual({ success: true, data: null });
    expect(mocks.passkeyDelete).toHaveBeenCalledWith(
      expect.objectContaining({ passkeyId: "pk-123" }),
    );
  });

  it("forwards the exact passkey id argument", async () => {
    mocks.passkeyDelete.mockResolvedValue({ error: null });

    await deleteUserPasskey("another-id");

    expect(mocks.passkeyDelete).toHaveBeenCalledWith(
      expect.objectContaining({ passkeyId: "another-id" }),
    );
  });

  it("returns failure when supabase reports an error", async () => {
    mocks.passkeyDelete.mockResolvedValue({
      error: { message: "not found" },
    });

    const res = await deleteUserPasskey("pk-404");

    expect(res).toEqual({ success: false, error: "not found" });
  });

  it("catches thrown errors and returns failure", async () => {
    mocks.passkeyDelete.mockRejectedValue(new Error("timeout"));

    const res = await deleteUserPasskey("pk-x");

    expect(res.success).toBe(false);
    expect(res.error).toBe("timeout");
  });
});
