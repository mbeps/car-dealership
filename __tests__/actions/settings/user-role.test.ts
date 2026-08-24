import { beforeEach, describe, expect, it, vi } from "vitest";
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

  const adminUserBuilder = makeBuilder();
  const targetUserBuilder = makeBuilder();

  return {
    authGetUser: vi.fn(),
    rpc: vi.fn(),
    adminUserBuilder,
    targetUserBuilder,
    fromMock: vi.fn(() => adminUserBuilder.chainProxy),
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

import { updateUserRole } from "@/actions/settings/update-user-role";
import { getUsers } from "@/actions/settings/get-users";

function relinkDefaults() {
  // Touch the proxies so lazy mocks exist before configuration
  mocks.adminUserBuilder.chainProxy.single;
  mocks.targetUserBuilder.chainProxy.eq;
  mocks.targetUserBuilder.chainProxy.order;
  // ensureAdminUser path: auth ok + admin row
  mocks.authGetUser.mockResolvedValue({
    data: { user: { id: "auth-1" } },
    error: null,
  });
  mocks.adminUserBuilder.b.single.mockResolvedValue({
    data: { id: "admin-1", role: UserRole.ADMIN },
    error: null,
  });
  mocks.targetUserBuilder.b.eq.mockResolvedValue({ data: null, error: null });
  mocks.adminUserBuilder.b.order.mockResolvedValue({
    data: [{ id: "u1" }],
    error: null,
  });
}

describe("updateUserRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    relinkDefaults();
    // Route the update chain to the dedicated builder
    mocks.adminUserBuilder.b.update.mockReturnValue(
      mocks.targetUserBuilder.chainProxy,
    );
  });

  it("throws Unauthorized when not signed in", async () => {
    mocks.authGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await updateUserRole("u2", UserRole.ADMIN);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("rejects non-admin callers", async () => {
    mocks.adminUserBuilder.b.single.mockResolvedValue({
      data: { id: "admin-1", role: UserRole.USER },
      error: null,
    });

    const result = await updateUserRole("u2", UserRole.ADMIN);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized access");
  });

  it("prevents changing your own role", async () => {
    const result = await updateUserRole("admin-1", UserRole.USER);

    expect(result.success).toBe(false);
    expect(result.error).toContain("cannot change your own role");
  });

  it("updates the target user's role and revalidates settings", async () => {
    const result = await updateUserRole("u2", UserRole.ADMIN);

    expect(result.success).toBe(true);
    expect(mocks.adminUserBuilder.b.update).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.ADMIN }),
    );
    expect(mocks.targetUserBuilder.b.eq).toHaveBeenCalledWith("id", "u2");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/settings");
  });

  it("surfaces update errors as failures", async () => {
    mocks.targetUserBuilder.b.eq.mockResolvedValue({
      data: null,
      error: { message: "rls denied" },
    });

    const result = await updateUserRole("u2", UserRole.USER);

    // ponytail: action rethrows the raw PostgrestError object (not an Error),
    // so the catch falls back to the generic message
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unexpected error");
  });
});

describe("getUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    relinkDefaults();
  });

  it("returns Unauthorized for non-admins", async () => {
    mocks.adminUserBuilder.b.single.mockResolvedValue({
      data: { id: "admin-1", role: UserRole.USER },
      error: null,
    });

    const result = await getUsers();

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized access");
  });

  it("fetches all users sorted newest first", async () => {
    const result = await getUsers();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([{ id: "u1" }]);
    expect(mocks.adminUserBuilder.b.order).toHaveBeenCalledWith("createdAt", {
      ascending: false,
    });
  });

  it("surfaces query errors as failures", async () => {
    mocks.adminUserBuilder.b.order.mockResolvedValue({
      data: null,
      error: { message: "timeout" },
    });

    const result = await getUsers();

    // ponytail: raw PostgrestError is not an Error instance → generic message
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unexpected error");
  });
});
