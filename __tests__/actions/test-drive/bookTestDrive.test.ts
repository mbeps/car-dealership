import { beforeEach, describe, expect, it, vi } from "vitest";
import { bookTestDrive } from "@/actions/test-drive/book-test-drive";
import { BookingStatusEnum as BookingStatus } from "@/enums/booking-status";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import type { TestDriveFormData } from "@/types/test-drive/test-drive-form-data";

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
    // Pre-create all methods so they can be configured before first use
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
  const bookingBuilder = makeBuilder();
  const insertBuilder = makeBuilder();

  return {
    authGetUser: vi.fn(),
    rpc: vi.fn(),
    userBuilder,
    carBuilder,
    bookingBuilder,
    insertBuilder,
    fromMock: vi.fn((table: string) => {
      if (table === "User") return userBuilder.chainProxy;
      if (table === "Car") return carBuilder.chainProxy;
      // TestDriveBooking reads use one builder; inserts get the dedicated one
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

const formData: TestDriveFormData = {
  carId: "car-1",
  bookingDate: "2026-09-01",
  startTime: "10:00",
  endTime: "11:00",
  notes: "first time buyer",
};

function relinkDefaults() {
  // Touch the proxies so lazy mocks exist before configuration
  const { select, eq, in: inFn, insert, single } = mocks.userBuilder.chainProxy;
  void select;
  void eq;
  void inFn;
  void insert;
  void single;
  mocks.carBuilder.chainProxy.eq;
  mocks.bookingBuilder.chainProxy.in;
  mocks.insertBuilder.chainProxy.single;
  mocks.authGetUser.mockResolvedValue({
    data: { user: { id: "auth-1" } },
    error: null,
  });
  mocks.userBuilder.b.single.mockResolvedValue({
    data: { id: "user-1", role: UserRole.USER },
    error: null,
  });
  mocks.carBuilder.b.single.mockResolvedValue({
    data: { id: "car-1", status: CarStatus.AVAILABLE },
    error: null,
  });
  mocks.bookingBuilder.b.single.mockResolvedValue({ data: null, error: null });
  // Route the insert chain to its dedicated builder
  mocks.bookingBuilder.b.insert.mockReturnValue(mocks.insertBuilder.chainProxy);
  void mocks.userBuilder;
  mocks.insertBuilder.b.single.mockResolvedValue({
    data: { id: "booking-1" },
    error: null,
  });
}

describe("bookTestDrive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    relinkDefaults();
  });

  it("rejects unauthenticated users", async () => {
    mocks.authGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await bookTestDrive(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("logged in");
  });

  it("fails when the app user row is missing", async () => {
    mocks.userBuilder.b.single.mockResolvedValue({ data: null, error: null });

    const result = await bookTestDrive(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("User not found");
  });

  it("blocks admins from booking via the public form", async () => {
    mocks.userBuilder.b.single.mockResolvedValue({
      data: { id: "user-1", role: UserRole.ADMIN },
      error: null,
    });

    const result = await bookTestDrive(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Admins cannot book");
  });

  it("looks up the user by supabaseAuthUserId", async () => {
    await bookTestDrive(formData);

    expect(mocks.userBuilder.b.eq).toHaveBeenCalledWith(
      "supabaseAuthUserId",
      "auth-1",
    );
  });

  it("rejects when the car is not available", async () => {
    mocks.carBuilder.b.single.mockResolvedValue({ data: null, error: null });

    const result = await bookTestDrive(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("not available");
  });

  it("checks availability with status filter on the car lookup", async () => {
    await bookTestDrive(formData);

    expect(mocks.fromMock).toHaveBeenCalledWith("Car");
    expect(mocks.carBuilder.b.eq).toHaveBeenCalledWith("id", "car-1");
    expect(mocks.carBuilder.b.eq).toHaveBeenCalledWith(
      "status",
      CarStatus.AVAILABLE,
    );
  });

  it("returns an error when the slot is already booked", async () => {
    mocks.bookingBuilder.b.single.mockResolvedValue({
      data: { id: "existing" },
      error: null,
    });

    const result = await bookTestDrive(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("already booked");
  });

  it("conflict check filters on pending/confirmed statuses for same slot", async () => {
    await bookTestDrive(formData);

    expect(mocks.fromMock).toHaveBeenCalledWith("TestDriveBooking");
    expect(mocks.bookingBuilder.b.eq).toHaveBeenCalledWith("carId", "car-1");
    expect(mocks.bookingBuilder.b.eq).toHaveBeenCalledWith(
      "bookingDate",
      "2026-09-01",
    );
    expect(mocks.bookingBuilder.b.eq).toHaveBeenCalledWith(
      "startTime",
      "10:00",
    );
    expect(mocks.bookingBuilder.b.in).toHaveBeenCalledWith("status", [
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
    ]);
  });

  it("creates a PENDING booking with correct payload", async () => {
    const result = await bookTestDrive(formData);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: "booking-1" });
    expect(mocks.bookingBuilder.b.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        carId: "car-1",
        userId: "user-1",
        bookingDate: "2026-09-01",
        startTime: "10:00",
        endTime: "11:00",
        notes: "first time buyer",
        status: BookingStatus.PENDING,
      }),
    );
  });

  it("normalises empty notes to null", async () => {
    await bookTestDrive({ ...formData, notes: "" });

    expect(mocks.bookingBuilder.b.insert).toHaveBeenCalledWith(
      expect.objectContaining({ notes: null }),
    );
  });

  it("revalidates test drive and car detail pages on success", async () => {
    await bookTestDrive(formData);

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/test-drive/car-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/cars/car-1");
  });

  it("does not insert or revalidate when slot conflicts", async () => {
    mocks.bookingBuilder.b.single.mockResolvedValue({
      data: { id: "existing" },
      error: null,
    });

    await bookTestDrive(formData);

    expect(mocks.insertBuilder.b.insert).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("surfaces insert errors as failure responses", async () => {
    mocks.insertBuilder.b.single.mockResolvedValue({
      data: null,
      error: { message: "db down" },
    });

    const result = await bookTestDrive(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("db down");
  });
});
