import { beforeEach, describe, expect, it, vi } from "vitest";
import { cancelTestDrive } from "@/actions/test-drive/cancel-test-drive";
import { getUserTestDrives } from "@/actions/test-drive/get-user-test-drives";
import { BookingStatusEnum as BookingStatus } from "@/enums/booking-status";
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
  const bookingBuilder = makeBuilder();
  const updateBuilder = makeBuilder();

  return {
    authGetUser: vi.fn(),
    rpc: vi.fn(),
    userBuilder,
    bookingBuilder,
    updateBuilder,
    fromMock: vi.fn((table: string) => {
      if (table === "User") return userBuilder.chainProxy;
      return bookingBuilder.chainProxy;
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
  mocks.bookingBuilder.chainProxy.order;
  mocks.updateBuilder.chainProxy.eq;
  mocks.authGetUser.mockResolvedValue({
    data: { user: { id: "auth-1" } },
    error: null,
  });
  mocks.userBuilder.b.single.mockResolvedValue({
    data: { id: "user-1", role: UserRole.USER },
    error: null,
  });
  mocks.bookingBuilder.b.single.mockResolvedValue({
    data: { id: "booking-1", userId: "user-1", status: BookingStatus.PENDING },
    error: null,
  });
  mocks.bookingBuilder.b.order.mockResolvedValue({ data: [], error: null });
  mocks.bookingBuilder.b.update.mockReturnValue(mocks.updateBuilder.chainProxy);
  mocks.updateBuilder.b.eq.mockResolvedValue({ data: null, error: null });
}

describe("cancelTestDrive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    relinkDefaults();
  });

  it("returns Unauthorized when not signed in", async () => {
    mocks.authGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await cancelTestDrive("booking-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("fails when the app user row is missing", async () => {
    mocks.userBuilder.b.single.mockResolvedValue({ data: null, error: null });

    const result = await cancelTestDrive("booking-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("User not found");
  });

  it("fails when booking does not exist", async () => {
    mocks.bookingBuilder.b.single.mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await cancelTestDrive("missing");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Booking not found");
    expect(mocks.bookingBuilder.b.eq).toHaveBeenCalledWith("id", "missing");
  });

  it("denies cancellation of another user's booking for non-admins", async () => {
    mocks.bookingBuilder.b.single.mockResolvedValue({
      data: { id: "booking-1", userId: "someone-else", status: "PENDING" },
      error: null,
    });

    const result = await cancelTestDrive("booking-1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized to cancel");
  });

  it("allows admins to cancel other users' bookings", async () => {
    mocks.userBuilder.b.single.mockResolvedValue({
      data: { id: "user-1", role: UserRole.ADMIN },
      error: null,
    });
    mocks.bookingBuilder.b.single.mockResolvedValue({
      data: { id: "booking-1", userId: "someone-else", status: "PENDING" },
      error: null,
    });

    const result = await cancelTestDrive("booking-1");

    expect(result.success).toBe(true);
  });

  it("rejects already-cancelled bookings", async () => {
    mocks.bookingBuilder.b.single.mockResolvedValue({
      data: {
        id: "booking-1",
        userId: "user-1",
        status: BookingStatus.CANCELLED,
      },
      error: null,
    });

    const result = await cancelTestDrive("booking-1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("already cancelled");
  });

  it("rejects completed bookings", async () => {
    mocks.bookingBuilder.b.single.mockResolvedValue({
      data: {
        id: "booking-1",
        userId: "user-1",
        status: BookingStatus.COMPLETED,
      },
      error: null,
    });

    const result = await cancelTestDrive("booking-1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("completed");
  });

  it("updates status to CANCELLED and revalidates pages on success", async () => {
    const result = await cancelTestDrive("booking-1");

    expect(result.success).toBe(true);
    expect(mocks.bookingBuilder.b.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: BookingStatus.CANCELLED }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalled();
  });
});

describe("getUserTestDrives", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    relinkDefaults();
  });

  it("returns Unauthorized when not signed in", async () => {
    mocks.authGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await getUserTestDrives();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("fails when the app user row is missing", async () => {
    mocks.userBuilder.b.single.mockResolvedValue({ data: null, error: null });

    const result = await getUserTestDrives();

    expect(result.success).toBe(false);
    expect(result.error).toBe("User not found");
  });

  it("queries bookings scoped to the current user, newest first", async () => {
    await getUserTestDrives();

    expect(mocks.fromMock).toHaveBeenCalledWith("TestDriveBooking");
    expect(mocks.bookingBuilder.b.eq).toHaveBeenCalledWith("userId", "user-1");
    expect(mocks.bookingBuilder.b.order).toHaveBeenCalledWith("bookingDate", {
      ascending: false,
    });
  });

  it("maps bookings with nested car data", async () => {
    mocks.bookingBuilder.b.order.mockResolvedValue({
      data: [
        {
          id: "b1",
          carId: "car-1",
          bookingDate: "2026-09-01",
          startTime: "10:00",
          endTime: "11:00",
          notes: null,
          status: "PENDING",
          createdAt: "2026-08-01T00:00:00.000Z",
          updatedAt: "2026-08-01T00:00:00.000Z",
          car: {
            id: "car-1",
            carMakeId: "m1",
            make: "Tesla",
            carColorId: "c1",
            color: "Red",
            price: 10000,
            mileage: 5000,
            year: 2024,
            seats: 5,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            carMake: { id: "m1", name: "Tesla", slug: "tesla" },
            carColor: { id: "c1", name: "Red", slug: "red" },
          },
        },
      ],
      error: null,
    });

    const result = await getUserTestDrives();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]).toMatchObject({ id: "b1", carId: "car-1" });
  });
});
