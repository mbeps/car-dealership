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
import { addFAQ } from "@/actions/home/add-faq";
import { updateFAQ } from "@/actions/home/update-faq";
import { deleteFAQ } from "@/actions/home/delete-faq";
import { getFAQs } from "@/actions/home/get-faqs";

const validFAQ = { question: "Q?", answer: "A", order: 1 };
const faqRow = { id: "faq-1", ...validFAQ };

beforeEach(() => {
  vi.clearAllMocks();
  h.authUser.value = null;
  h.getUserError.value = null;
});

describe("addFAQ", () => {
  it("creates a FAQ for an admin and returns the row", async () => {
    setupAdmin();
    h.singleQueues["FAQ"] = [{ data: faqRow, error: null }];

    const res = await addFAQ(validFAQ);

    expect(res).toEqual({ success: true, data: faqRow });
    const b = h.getBuilder("FAQ");
    expect(b.insert).toHaveBeenCalledWith(
      expect.objectContaining({ question: "Q?", answer: "A", order: 1 }),
    );
    expect(revalidateTag).toHaveBeenCalledWith("faq", "max");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("rejects invalid payload via schema before touching db", async () => {
    setupAdmin();
    const res = await addFAQ({ question: "", answer: "A", order: 1 });

    expect(res.success).toBe(false);
    expect(h.getBuilder("FAQ").insert).not.toHaveBeenCalled();
  });

  it("denies unauthenticated users", async () => {
    setupNoUser();
    const res = await addFAQ(validFAQ);
    expect(res).toEqual({ success: false, error: "Unauthorized" });
    expect(h.getBuilder("FAQ").insert).not.toHaveBeenCalled();
  });

  it("denies non-admin users", async () => {
    setupNonAdmin();
    const res = await addFAQ(validFAQ);
    expect(res).toEqual({ success: false, error: "Unauthorized access" });
    expect(h.getBuilder("FAQ").insert).not.toHaveBeenCalled();
  });

  it("returns error when insert fails", async () => {
    setupAdmin();
    h.singleQueues["FAQ"] = [{ data: null, error: { message: "insert boom" } }];

    const res = await addFAQ(validFAQ);
    expect(res).toEqual({ success: false, error: "insert boom" });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("queries the user role scoped to the auth id", async () => {
    setupAdmin();
    h.singleQueues["FAQ"] = [{ data: faqRow, error: null }];
    await addFAQ(validFAQ);

    const ub = h.getBuilder("User");
    expect(ub.select).toHaveBeenCalledWith("role");
    expect(ub.eq).toHaveBeenCalledWith("supabaseAuthUserId", "auth-1");
  });
});

describe("updateFAQ", () => {
  it("updates and returns the FAQ for an admin", async () => {
    setupAdmin();
    h.singleQueues["FAQ"] = [{ data: faqRow, error: null }];

    const res = await updateFAQ("faq-1", validFAQ);

    expect(res).toEqual({ success: true, data: faqRow });
    const b = h.getBuilder("FAQ");
    expect(b.update).toHaveBeenCalledWith(
      expect.objectContaining({ question: "Q?", order: 1 }),
    );
    expect(b.eq).toHaveBeenCalledWith("id", "faq-1");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("rejects invalid payload", async () => {
    setupAdmin();
    const res = await updateFAQ("faq-1", { ...validFAQ, answer: "" });
    expect(res.success).toBe(false);
    expect(h.getBuilder("FAQ").update).not.toHaveBeenCalled();
  });

  it("denies unauthenticated users", async () => {
    setupNoUser();
    const res = await updateFAQ("faq-1", validFAQ);
    expect(res).toEqual({ success: false, error: "Unauthorized" });
  });

  it("denies non-admin users", async () => {
    setupNonAdmin();
    const res = await updateFAQ("faq-1", validFAQ);
    expect(res).toEqual({ success: false, error: "Unauthorized access" });
  });

  it("returns error when update fails", async () => {
    setupAdmin();
    h.singleQueues["FAQ"] = [{ data: null, error: { message: "update boom" } }];
    const res = await updateFAQ("faq-1", validFAQ);
    expect(res).toEqual({ success: false, error: "update boom" });
  });
});

describe("deleteFAQ", () => {
  it("deletes by id for an admin", async () => {
    setupAdmin();
    h.results["FAQ"] = { data: [], error: null };

    const res = await deleteFAQ("faq-9");

    expect(res).toEqual({ success: true, data: undefined });
    const b = h.getBuilder("FAQ");
    expect(b.delete).toHaveBeenCalled();
    expect(b.eq).toHaveBeenCalledWith("id", "faq-9");
    expect(revalidateTag).toHaveBeenCalledWith("faq", "max");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("denies unauthenticated users", async () => {
    setupNoUser();
    const res = await deleteFAQ("faq-9");
    expect(res).toEqual({ success: false, error: "Unauthorized" });
    expect(h.getBuilder("FAQ").delete).not.toHaveBeenCalled();
  });

  it("denies non-admin users", async () => {
    setupNonAdmin();
    const res = await deleteFAQ("faq-9");
    expect(res).toEqual({ success: false, error: "Unauthorized access" });
  });

  it("returns error when delete fails", async () => {
    setupAdmin();
    h.results["FAQ"] = { data: null, error: { message: "delete boom" } };
    const res = await deleteFAQ("faq-9");
    expect(res).toEqual({ success: false, error: "delete boom" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("getFAQs", () => {
  it("fetches FAQs ordered ascending", async () => {
    h.results["FAQ"] = { data: [faqRow], error: null };

    const faqs = await getFAQs();

    expect(faqs).toEqual([faqRow]);
    const b = h.getBuilder("FAQ");
    expect(b.select).toHaveBeenCalledWith("*");
    expect(b.order).toHaveBeenCalledWith("order", { ascending: true });
  });

  it("returns empty array on error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    h.results["FAQ"] = { data: null, error: { message: "boom" } };

    expect(await getFAQs()).toEqual([]);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
