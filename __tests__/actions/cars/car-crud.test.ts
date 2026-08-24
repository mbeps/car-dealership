import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Shared chainable Supabase builder mock.
 * - One builder per table so call assertions never mix tables.
 * - Terminal results are configured per test via `h.results` / `h.singleQueues`.
 */
const h = vi.hoisted(() => {
  type Res = { data?: unknown; error?: unknown; count?: number };
  const results: Record<string, Res> = {};
  const singleQueues: Record<string, Res[]> = {};
  const maybeQueues: Record<string, Res[]> = {};
  const builders: Record<
    string,
    Record<string, ReturnType<typeof vi.fn>> & { then?: unknown }
  > = {};
  const getBuilder = (table: string) => {
    if (!builders[table]) {
      const b: Record<string, any> = {};
      for (const m of [
        "select",
        "eq",
        "ilike",
        "in",
        "or",
        "order",
        "limit",
        "range",
        "gte",
        "lte",
        "insert",
        "update",
        "delete",
      ]) {
        b[m] = vi.fn(() => b);
      }
      b.single = vi.fn(
        async () => singleQueues[table]?.shift() ?? { data: null, error: null },
      );
      b.maybeSingle = vi.fn(
        async () => maybeQueues[table]?.shift() ?? { data: null, error: null },
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
  const authUser: { value: unknown } = { value: null };
  const getUserError: { value: unknown } = { value: null };
  const adminStorage = {
    upload: vi.fn(),
    list: vi.fn(),
    remove: vi.fn(),
  };
  return {
    results,
    singleQueues,
    maybeQueues,
    builders,
    getBuilder,
    authUser,
    getUserError,
    adminStorage,
  };
});

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
  createAdminClient: () => ({
    storage: {
      from: () => ({
        upload: h.adminStorage.upload,
        list: h.adminStorage.list,
        remove: h.adminStorage.remove,
      }),
    },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/arcjet", () => ({ default: {} }));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_SUPABASE_URL: "https://sup.example.com" },
}));
vi.mock("uuid", () => ({ v4: () => "generated-car-id" }));
vi.mock("@/actions/storage/check-storage-quota", () => ({
  checkStorageQuota: vi.fn(async () => ({ allowed: true })),
}));

import { revalidatePath } from "next/cache";
import { addCar } from "@/actions/cars/add-car";
import { updateCar } from "@/actions/cars/update-car";
import { deleteCar } from "@/actions/cars/delete-car";
import { updateCarStatus } from "@/actions/cars/update-car-status";

const adminUser = { id: "auth-1" };
const dbAdmin = { id: "db-1", role: "ADMIN" };

const makeImage = (name = "a.jpg") =>
  new File([new Uint8Array([1, 2, 3])], name, { type: "image/jpeg" });

const carData = {
  carMakeId: "make-1",
  carColorId: "color-1",
  model: "Model S",
  year: 2024,
  price: 50000,
  mileage: 100,
  fuelType: "Electric",
  transmission: "Automatic",
  bodyType: "Sedan",
  numberPlate: "ABC-123",
  seats: 5,
  description: "Nice",
  status: "AVAILABLE",
  featured: false,
  features: ["AC"],
};

/** Sets up the two-step auth lookup (auth user -> db profile) as ADMIN. */
const authenticateAsAdmin = () => {
  h.authUser.value = adminUser;
  h.singleQueues["User"] = [{ data: dbAdmin, error: null }];
};

describe("addCar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(h.results)) delete h.results[k];
    for (const k of Object.keys(h.singleQueues)) delete h.singleQueues[k];
    h.authUser.value = null;
    h.getUserError.value = null;
    h.adminStorage.upload.mockResolvedValue({ data: {}, error: null });
  });

  const makeFormData = () => {
    const fd = new FormData();
    fd.set("carData", JSON.stringify(carData));
    fd.append("images", makeImage());
    return fd;
  };

  it("uploads image, inserts car and revalidates admin list on success", async () => {
    authenticateAsAdmin();

    const res = await addCar(makeFormData());

    expect(res.success).toBe(true);
    expect(h.adminStorage.upload).toHaveBeenCalledWith(
      expect.stringContaining("cars/generated-car-id/image-"),
      expect.any(Buffer),
      { contentType: "image/jpeg" },
    );
    expect(h.builders["Car"].insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "generated-car-id",
        model: "Model S",
        price: "50000",
        storage_bytes: 3,
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin/cars");
  });

  it("throws when car data is missing", async () => {
    await expect(addCar(new FormData())).rejects.toThrow(
      /Error adding car:.*Car data is required/,
    );
  });

  it("throws when no images provided", async () => {
    const fd = new FormData();
    fd.set("carData", JSON.stringify(carData));

    await expect(addCar(fd)).rejects.toThrow(/At least one image is required/);
  });

  it("throws when unauthenticated", async () => {
    await expect(addCar(makeFormData())).rejects.toThrow(/Unauthorized/);
    expect(h.builders["Car"].insert).not.toHaveBeenCalled();
  });

  it("throws when user is not an admin", async () => {
    h.authUser.value = adminUser;
    h.singleQueues["User"] = [
      { data: { id: "db-1", role: "USER" }, error: null },
    ];

    await expect(addCar(makeFormData())).rejects.toThrow(/Unauthorized/);
  });

  it("throws when storage quota is exceeded", async () => {
    authenticateAsAdmin();
    const { checkStorageQuota } =
      await import("@/actions/storage/check-storage-quota");
    vi.mocked(checkStorageQuota).mockResolvedValueOnce({
      allowed: false,
      remainingBytes: 0,
    } as never);

    await expect(addCar(makeFormData())).rejects.toThrow(
      /Global storage limit reached/,
    );
  });

  it("throws when image upload fails", async () => {
    authenticateAsAdmin();
    h.adminStorage.upload.mockResolvedValue({
      data: null,
      error: { message: "bucket full" },
    });

    await expect(addCar(makeFormData())).rejects.toThrow(
      /Failed to upload image/,
    );
  });

  it("throws when insert fails", async () => {
    authenticateAsAdmin();
    h.results["Car"] = { data: null, error: { message: "dup key" } };

    await expect(addCar(makeFormData())).rejects.toThrow(/dup key/);
  });
});

describe("updateCar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(h.results)) delete h.results[k];
    for (const k of Object.keys(h.singleQueues)) delete h.singleQueues[k];
    h.authUser.value = null;
    h.getUserError.value = null;
    h.adminStorage.upload.mockResolvedValue({ data: {}, error: null });
    h.adminStorage.list.mockResolvedValue({
      data: [{ name: "old.jpg", metadata: { size: 10 } }],
      error: null,
    });
    h.adminStorage.remove.mockResolvedValue({ data: null, error: null });
  });

  const makeFormData = (extra?: (fd: FormData) => void) => {
    const fd = new FormData();
    fd.set("carId", "car-1");
    fd.set("carData", JSON.stringify(carData));
    extra?.(fd);
    return fd;
  };

  it("removes images, updates car and revalidates both pages", async () => {
    authenticateAsAdmin();
    h.singleQueues["Car"] = [
      {
        data: {
          images: [
            "https://sup.example.com/storage/v1/object/public/car-images/cars/car-1/old.jpg",
            "https://sup.example.com/storage/v1/object/public/car-images/cars/car-1/kept.jpg",
          ],
        },
        error: null,
      },
      { data: { storage_bytes: 100 }, error: null },
    ];

    const res = await updateCar(
      makeFormData((fd) =>
        fd.append(
          "imagesToRemove",
          "https://sup.example.com/storage/v1/object/public/car-images/cars/car-1/old.jpg",
        ),
      ),
    );

    expect(res.success).toBe(true);
    expect(h.adminStorage.remove).toHaveBeenCalledWith(["cars/car-1/old.jpg"]);
    expect(h.builders["Car"].update).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "Model S",
        images: [
          "https://sup.example.com/storage/v1/object/public/car-images/cars/car-1/kept.jpg",
        ],
        storage_bytes: 90,
      }),
    );
    expect(h.builders["Car"].eq).toHaveBeenCalledWith("id", "car-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/cars");
    expect(revalidatePath).toHaveBeenCalledWith(
      expect.stringContaining("cars/car-1"),
    );
  });

  it("returns error when car does not exist", async () => {
    authenticateAsAdmin();
    h.singleQueues["Car"] = [{ data: null, error: null }];

    const res = await updateCar(makeFormData());

    expect(res.success).toBe(false);
    expect(res.error).toBe("Car not found");
  });

  it("returns error when removing all images would leave none", async () => {
    authenticateAsAdmin();
    h.singleQueues["Car"] = [
      {
        data: {
          images: [
            "https://sup.example.com/storage/v1/object/public/car-images/cars/car-1/old.jpg",
          ],
        },
        error: null,
      },
      { data: { storage_bytes: 100 }, error: null },
    ];

    const res = await updateCar(
      makeFormData((fd) =>
        fd.append(
          "imagesToRemove",
          "https://sup.example.com/storage/v1/object/public/car-images/cars/car-1/old.jpg",
        ),
      ),
    );

    expect(res.success).toBe(false);
    expect(res.error).toBe("At least one image is required");
  });

  it("throws when unauthenticated", async () => {
    await expect(updateCar(makeFormData())).rejects.toThrow(
      /Error updating car: Unauthorized/,
    );
  });

  it("throws when carId or data missing", async () => {
    await expect(updateCar(new FormData())).rejects.toThrow(
      /Car ID and data are required/,
    );
  });

  it("throws when quota exceeded", async () => {
    authenticateAsAdmin();
    h.singleQueues["Car"] = [
      { data: { images: ["kept.jpg"] }, error: null },
      { data: { storage_bytes: 0 }, error: null },
    ];
    const { checkStorageQuota } =
      await import("@/actions/storage/check-storage-quota");
    vi.mocked(checkStorageQuota).mockResolvedValueOnce({
      allowed: false,
      remainingBytes: 0,
    } as never);

    await expect(updateCar(makeFormData())).rejects.toThrow(
      /Global storage limit reached/,
    );
  });
});

describe("deleteCar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(h.results)) delete h.results[k];
    h.authUser.value = adminUser;
    h.getUserError.value = null;
    h.adminStorage.list.mockResolvedValue({
      data: [{ name: "img.jpg" }],
      error: null,
    });
    h.adminStorage.remove.mockResolvedValue({ data: null, error: null });
  });

  it("deletes bookings then car, cleans storage and revalidates", async () => {
    const res = await deleteCar("car-1");

    expect(res.success).toBe(true);
    expect(h.builders["TestDriveBooking"].delete).toHaveBeenCalled();
    expect(h.builders["TestDriveBooking"].eq).toHaveBeenCalledWith(
      "carId",
      "car-1",
    );
    expect(h.builders["Car"].delete).toHaveBeenCalled();
    expect(h.builders["Car"].eq).toHaveBeenCalledWith("id", "car-1");
    expect(h.adminStorage.remove).toHaveBeenCalledWith(["cars/car-1/img.jpg"]);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/cars");
  });

  it("proceeds even when storage cleanup fails", async () => {
    h.adminStorage.list.mockRejectedValue(new Error("storage down"));

    const res = await deleteCar("car-1");

    expect(res.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/cars");
  });

  it("returns error when booking deletion fails", async () => {
    h.results["TestDriveBooking"] = {
      data: null,
      error: { message: "fk boom" },
    };

    const res = await deleteCar("car-1");

    expect(res.success).toBe(false);
    expect(res.error).toContain("fk boom");
    expect(h.builders["Car"].delete).not.toHaveBeenCalled();
  });

  it("returns error when unauthenticated", async () => {
    h.authUser.value = null;

    const res = await deleteCar("car-1");

    expect(res.success).toBe(false);
    expect(res.error).toContain("Unauthorized");
  });
});

describe("updateCarStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(h.results)) delete h.results[k];
    h.authUser.value = adminUser;
    h.getUserError.value = null;
  });

  it("updates status only", async () => {
    const res = await updateCarStatus("car-1", { status: "SOLD" as never });

    expect(res.success).toBe(true);
    expect(h.builders["Car"].update).toHaveBeenCalledWith({ status: "SOLD" });
    expect(h.builders["Car"].eq).toHaveBeenCalledWith("id", "car-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/cars");
  });

  it("updates featured only", async () => {
    const res = await updateCarStatus("car-1", { featured: true });

    expect(res.success).toBe(true);
    expect(h.builders["Car"].update).toHaveBeenCalledWith({ featured: true });
  });

  it("updates both status and featured together", async () => {
    const res = await updateCarStatus("car-1", {
      status: "AVAILABLE" as never,
      featured: false,
    });

    expect(res.success).toBe(true);
    expect(h.builders["Car"].update).toHaveBeenCalledWith({
      status: "AVAILABLE",
      featured: false,
    });
  });

  it("returns error when update fails", async () => {
    h.results["Car"] = { data: null, error: { message: "row locked" } };

    const res = await updateCarStatus("car-1", { status: "SOLD" as never });

    expect(res.success).toBe(false);
    expect(res.error).toContain("row locked");
  });

  it("returns error when unauthenticated", async () => {
    h.authUser.value = null;

    const res = await updateCarStatus("car-1", { status: "SOLD" as never });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Unauthorized");
  });
});
