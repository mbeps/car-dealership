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
import { getHomePageContent } from "@/actions/home/get-home-page-content";
import { updateHomePageContent } from "@/actions/home/update-home-page-content";

const content = {
  id: "singleton",
  heroTitle: "Welcome",
  heroSubtitle: "Find your car",
  feature1Title: "Fast",
  feature1Description: "Very fast",
  feature2Title: "Safe",
  feature2Description: "Very safe",
  feature3Title: "Cheap",
  feature3Description: "Very cheap",
  ctaTitle: "Browse",
  ctaSubtitle: "Browse cars now",
};

beforeEach(() => {
  vi.clearAllMocks();
  h.authUser.value = null;
  h.getUserError.value = null;
});

describe("getHomePageContent", () => {
  it("fetches the singleton row", async () => {
    h.singleQueues.HomePageContent = [{ data: content, error: null }];

    expect(await getHomePageContent()).toEqual(content);
    const b = h.getBuilder("HomePageContent");
    expect(b.select).toHaveBeenCalledWith("*");
    expect(b.single).toHaveBeenCalled();
  });

  it("returns null on error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    h.singleQueues.HomePageContent = [
      { data: null, error: { message: "boom" } },
    ];

    expect(await getHomePageContent()).toBeNull();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe("updateHomePageContent", () => {
  it("updates the singleton with validated partial data", async () => {
    setupAdmin();
    h.singleQueues.HomePageContent = [{ data: content, error: null }];

    const res = await updateHomePageContent({ heroTitle: "New title" });

    expect(res).toEqual({ success: true, data: content });
    const b = h.getBuilder("HomePageContent");
    expect(b.update).toHaveBeenCalledWith(
      expect.objectContaining({ heroTitle: "New title" }),
    );
    expect(b.eq).toHaveBeenCalledWith("id", "singleton");
    expect(revalidateTag).toHaveBeenCalledWith("home-content", "max");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("rejects invalid partial payload via schema", async () => {
    setupAdmin();
    const res = await updateHomePageContent({ heroTitle: "" });

    expect(res.success).toBe(false);
    expect(h.getBuilder("HomePageContent").update).not.toHaveBeenCalled();
  });

  it("denies unauthenticated users", async () => {
    setupNoUser();
    const res = await updateHomePageContent({ heroTitle: "X" });
    expect(res).toEqual({ success: false, error: "Unauthorized" });
    expect(h.getBuilder("HomePageContent").update).not.toHaveBeenCalled();
  });

  it("denies non-admin users", async () => {
    setupNonAdmin();
    const res = await updateHomePageContent({ heroTitle: "X" });
    expect(res).toEqual({ success: false, error: "Unauthorized access" });
  });

  it("checks role scoped to the auth user's supabaseAuthUserId", async () => {
    setupAdmin();
    h.singleQueues.HomePageContent = [{ data: content, error: null }];
    await updateHomePageContent({ heroTitle: "X" });

    const ub = h.getBuilder("User");
    expect(ub.eq).toHaveBeenCalledWith("supabaseAuthUserId", "auth-1");
  });

  it("returns error when update fails and skips revalidation", async () => {
    setupAdmin();
    h.singleQueues.HomePageContent = [
      { data: null, error: { message: "update boom" } },
    ];

    const res = await updateHomePageContent({ heroTitle: "X" });
    expect(res).toEqual({ success: false, error: "update boom" });
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
