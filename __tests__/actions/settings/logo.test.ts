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

  const makeStorage = () => ({
    upload: vi.fn(),
    getPublicUrl: vi.fn(),
    remove: vi.fn(),
  });

  return {
    authGetUser: vi.fn(),
    adminBuilder: makeBuilder(),
    // select chain: .from().select().eq().single()
    dealershipSelect: makeBuilder(),
    // update chain (admin client): .from().update().eq()
    dealershipUpdate: makeBuilder(),
    adminStorage: makeStorage(),
    revalidateBrandingPages: vi.fn(),
    validateAndPrepareLogoUpload: vi.fn(),
    buildVersionedLogoPath: vi.fn(
      (_id: string, version: string, ext: string) => `logos/${version}.${ext}`,
    ),
  };
});

vi.mock("@/lib/supabase/supabase", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.authGetUser },
    from: (table: string) =>
      table === "User" ? mocks.adminBuilder.chainProxy : userDealershipFrom(),
  }),
  createAdminClient: () => ({
    from: () => mocks.dealershipUpdate.chainProxy,
    storage: { from: () => mocks.adminStorage },
  }),
}));

// ponytail: ensureAdminUser's client issues BOTH the select chain and the
// terminal update on "DealershipInfo"; delegate .update to its own builder so
// each chain keeps its own stubs. Upgrade path: none needed.
const userDealershipFrom = () =>
  new Proxy(mocks.dealershipSelect.chainProxy, {
    get(target, prop: string) {
      if (prop === "update") return mocks.dealershipUpdate.b.update;
      return Reflect.get(target as object, prop);
    },
  });

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/arcjet", () => ({ default: {} }));
vi.mock("@/lib/helpers/branding-cache", () => ({
  revalidateBrandingPages: mocks.revalidateBrandingPages,
}));
vi.mock("@/lib/helpers/validate-and-prepare-logo-upload", () => ({
  validateAndPrepareLogoUpload: mocks.validateAndPrepareLogoUpload,
}));
vi.mock("@/lib/helpers/build-versioned-logo-path", () => ({
  buildVersionedLogoPath: mocks.buildVersionedLogoPath,
}));

import { removeDealershipLogo } from "@/actions/settings/remove-dealership-logo";
import { updateDealershipLogo } from "@/actions/settings/update-dealership-logo";

function relinkDefaults() {
  mocks.authGetUser.mockResolvedValue({
    data: { user: { id: "auth-1" } },
    error: null,
  });
  // ensureAdminUser
  mocks.adminBuilder.b.single.mockResolvedValue({
    data: { id: "admin-1", role: "ADMIN" },
    error: null,
  });
  // dealership select
  mocks.dealershipSelect.b.single.mockResolvedValue({
    data: { id: "d-1", logoPath: "logos/old.png" },
    error: null,
  });
  // dealership update succeeds by default
  mocks.dealershipUpdate.b.eq.mockResolvedValue({ data: null, error: null });
  // vi.clearAllMocks() does not reset implementations, so re-assert the
  // default path builder here to avoid cross-test leakage.
  mocks.buildVersionedLogoPath.mockImplementation(
    (_id: string, version: string, ext: string) => `logos/${version}.${ext}`,
  );
  mocks.validateAndPrepareLogoUpload.mockReturnValue({
    bytes: Buffer.from("logo"),
    extension: "png",
    mimeType: "image/png",
    sizeBytes: 4,
  });
  mocks.adminStorage.upload.mockResolvedValue({ data: {}, error: null });
  mocks.adminStorage.getPublicUrl.mockReturnValue({
    data: { publicUrl: "https://cdn.test/logos/new.png" },
  });
  mocks.adminStorage.remove.mockResolvedValue({ data: {}, error: null });
}

const payload = {
  name: "logo.png",
  mimeType: "image/png",
  sizeBytes: 4,
  base64: Buffer.from("logo").toString("base64"),
};

describe("updateDealershipLogo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    relinkDefaults();
  });

  it("uploads a versioned logo and updates metadata for an admin", async () => {
    const result = await updateDealershipLogo("d-1", payload);

    expect(result.success).toBe(true);
    expect(result.data).toContain("updated successfully");
    expect(mocks.adminStorage.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^logos\/\d+\.png$/),
      expect.any(Buffer),
      expect.objectContaining({
        contentType: "image/png",
        cacheControl: "86400",
        upsert: false,
      }),
    );
    expect(mocks.dealershipUpdate.b.update).toHaveBeenCalledWith(
      expect.objectContaining({
        logoUrl: "https://cdn.test/logos/new.png",
        logoMimeType: "image/png",
      }),
    );
    expect(mocks.revalidateBrandingPages).toHaveBeenCalled();
  });

  it("removes the old logo after successful update", async () => {
    await updateDealershipLogo("d-1", payload);

    expect(mocks.adminStorage.remove).toHaveBeenCalledWith(["logos/old.png"]);
  });

  it("does not remove old logo when path is unchanged", async () => {
    mocks.buildVersionedLogoPath.mockReturnValue("logos/old.png");

    await updateDealershipLogo("d-1", payload);

    expect(mocks.adminStorage.remove).not.toHaveBeenCalled();
  });

  it("fails when dealership not found", async () => {
    mocks.dealershipSelect.b.single.mockResolvedValue({
      data: null,
      error: { message: "no rows" },
    });

    const result = await updateDealershipLogo("d-1", payload);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Dealership not found");
    expect(mocks.adminStorage.upload).not.toHaveBeenCalled();
  });

  it("rejects non-admin callers", async () => {
    mocks.adminBuilder.b.single.mockResolvedValue({
      data: { id: "u1", role: "USER" },
      error: null,
    });

    const result = await updateDealershipLogo("d-1", payload);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized access");
    expect(mocks.adminStorage.upload).not.toHaveBeenCalled();
  });

  it("fails when validation rejects the file", async () => {
    mocks.validateAndPrepareLogoUpload.mockImplementation(() => {
      throw new Error("File too large");
    });

    const result = await updateDealershipLogo("d-1", payload);

    expect(result.success).toBe(false);
    expect(result.error).toBe("File too large");
    expect(mocks.adminStorage.upload).not.toHaveBeenCalled();
  });

  it("fails when storage upload errors", async () => {
    mocks.adminStorage.upload.mockResolvedValue({
      data: null,
      error: { message: "bucket full" },
    });

    const result = await updateDealershipLogo("d-1", payload);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to upload logo: bucket full");
  });

  it("cleans up the uploaded file when metadata update fails", async () => {
    mocks.dealershipUpdate.b.eq.mockResolvedValue({
      data: null,
      error: { message: "meta fail" },
    });

    const result = await updateDealershipLogo("d-1", payload);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to update logo metadata");
    expect(mocks.adminStorage.remove).toHaveBeenCalledWith([
      expect.stringMatching(/^logos\/\d+\.png$/),
    ]);
  });
});

describe("removeDealershipLogo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    relinkDefaults();
  });

  it("clears logo metadata and deletes the stored file", async () => {
    const result = await removeDealershipLogo("d-1");

    expect(result.success).toBe(true);
    expect(result.data).toContain("removed successfully");
    expect(mocks.dealershipUpdate.b.update).toHaveBeenCalledWith(
      expect.objectContaining({
        logoUrl: null,
        logoPath: null,
        logoVersion: null,
      }),
    );
    expect(mocks.adminStorage.remove).toHaveBeenCalledWith(["logos/old.png"]);
    expect(mocks.revalidateBrandingPages).toHaveBeenCalled();
  });

  it("skips storage removal when no logoPath exists", async () => {
    mocks.dealershipSelect.b.single.mockResolvedValue({
      data: { id: "d-1", logoPath: null },
      error: null,
    });

    const result = await removeDealershipLogo("d-1");

    expect(result.success).toBe(true);
    expect(mocks.adminStorage.remove).not.toHaveBeenCalled();
  });

  it("succeeds even when storage file deletion throws", async () => {
    mocks.adminStorage.remove.mockRejectedValue(new Error("storage down"));

    const result = await removeDealershipLogo("d-1");

    expect(result.success).toBe(true);
  });

  it("fails when dealership not found", async () => {
    mocks.dealershipSelect.b.single.mockResolvedValue({
      data: null,
      error: { message: "no rows" },
    });

    const result = await removeDealershipLogo("d-1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Dealership not found");
  });

  it("returns error when metadata update fails", async () => {
    mocks.dealershipUpdate.b.eq.mockResolvedValue({
      data: null,
      error: { message: "meta fail" },
    });

    const result = await removeDealershipLogo("d-1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to remove logo metadata");
    expect(mocks.adminStorage.remove).not.toHaveBeenCalled();
  });

  it("rejects non-admin callers", async () => {
    mocks.adminBuilder.b.single.mockResolvedValue({
      data: { id: "u1", role: "USER" },
      error: null,
    });

    const result = await removeDealershipLogo("d-1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized access");
    expect(mocks.adminStorage.remove).not.toHaveBeenCalled();
  });
});
