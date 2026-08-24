import { beforeEach, describe, expect, it, vi } from "vitest";
import { h, setupAdmin, setupNonAdmin, setupNoUser } from "./_helpers";

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
  createPublicClient: () => ({
    from: (table: string) => h.getBuilder(table),
  }),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

import { revalidatePath, revalidateTag } from "next/cache";
import { reorderFAQs } from "@/actions/home/reorder-faqs";

const updates = [
  { id: "faq-1", order: 2 },
  { id: "faq-2", order: 1 },
];
const ordered = [
  { id: "faq-2", order: 1 },
  { id: "faq-1", order: 2 },
];

beforeEach(() => {
  vi.clearAllMocks();
  h.authUser.value = null;
  h.getUserError.value = null;
});

describe("reorderFAQs", () => {
  it("updates each FAQ's order and returns the ordered list", async () => {
    setupAdmin();
    h.results["FAQ"] = { data: ordered, error: null };

    const res = await reorderFAQs(updates);

    expect(res).toEqual({ success: true, data: ordered });
    const b = h.getBuilder("FAQ");
    expect(b.update).toHaveBeenCalledWith({ order: 2 });
    expect(b.update).toHaveBeenCalledWith({ order: 1 });
    expect(b.eq).toHaveBeenCalledWith("id", "faq-1");
    expect(b.eq).toHaveBeenCalledWith("id", "faq-2");
    expect(revalidateTag).toHaveBeenCalledWith("faq", "max");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("refetches FAQs ordered ascending after updating", async () => {
    setupAdmin();
    h.results["FAQ"] = { data: ordered, error: null };
    await reorderFAQs(updates);

    const b = h.getBuilder("FAQ");
    expect(b.select).toHaveBeenCalledWith("*");
    expect(b.order).toHaveBeenCalledWith("order", { ascending: true });
  });

  it("handles an empty updates array without failing", async () => {
    setupAdmin();
    h.results["FAQ"] = { data: [], error: null };

    const res = await reorderFAQs([]);
    expect(res).toEqual({ success: true, data: [] });
    expect(h.getBuilder("FAQ").update).not.toHaveBeenCalled();
  });

  it("denies unauthenticated users", async () => {
    setupNoUser();
    const res = await reorderFAQs(updates);
    expect(res).toEqual({ success: false, error: "Unauthorized" });
    expect(h.getBuilder("FAQ").update).not.toHaveBeenCalled();
  });

  it("denies non-admin users", async () => {
    setupNonAdmin();
    const res = await reorderFAQs(updates);
    expect(res).toEqual({ success: false, error: "Unauthorized access" });
    expect(h.getBuilder("FAQ").update).not.toHaveBeenCalled();
  });

  it("returns error when the refetch fails", async () => {
    setupAdmin();
    h.results["FAQ"] = { data: null, error: { message: "refetch boom" } };

    const res = await reorderFAQs(updates);
    expect(res).toEqual({ success: false, error: "refetch boom" });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("still succeeds when individual update promises reject silently (fire-and-forget)", async () => {
    // ponytail: documents current behaviour — Promise.all result is not awaited/checked
    setupAdmin();
    h.results["FAQ"] = { data: ordered, error: null };
    const b = h.getBuilder("FAQ");
    b.eq.mockImplementationOnce(() => {
      throw new Error("update boom");
    });

    await expect(reorderFAQs(updates)).resolves.toEqual({
      success: false,
      error: "update boom",
    });
  });
});
