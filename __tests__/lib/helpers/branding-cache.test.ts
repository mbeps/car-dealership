import { describe, it, expect, vi, beforeEach } from "vitest";

const { revalidateTagMock, revalidatePathMock } = vi.hoisted(() => ({
  revalidateTagMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: revalidateTagMock,
  revalidatePath: revalidatePathMock,
}));

import {
  BRANDING_CACHE_TAG,
  revalidateBrandingPages,
} from "@/lib/helpers/branding-cache";

describe("revalidateBrandingPages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports the public-branding cache tag", () => {
    expect(BRANDING_CACHE_TAG).toBe("public-branding");
  });

  it("revalidates the branding cache tag via the fetch cache profile", () => {
    revalidateBrandingPages();

    expect(revalidateTagMock).toHaveBeenCalledWith("public-branding", "max");
  });

  it("revalidates admin settings, home and cars paths", () => {
    revalidateBrandingPages();

    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/settings");
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/cars");
  });

  it("revalidates root and admin layouts so headers/icons pick up new assets", () => {
    revalidateBrandingPages();

    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin", "layout");
  });

  it("calls revalidateTag exactly once per invocation", () => {
    revalidateBrandingPages();

    expect(revalidateTagMock).toHaveBeenCalledTimes(1);
  });

  it("revalidates five distinct path targets per invocation", () => {
    revalidateBrandingPages();

    expect(revalidatePathMock).toHaveBeenCalledTimes(5);
  });
});
