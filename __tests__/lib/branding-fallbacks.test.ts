import {
  ICON_FALLBACK_SRC,
  ICON_SECONDARY_FALLBACK_SRC,
} from "@/lib/branding/branding-constants";
import { appendVersionToAssetUrl } from "@/lib/branding/append-version-to-asset-url";
import { resolveHeaderLogoSrc } from "@/lib/branding/resolve-header-logo-src";
import { resolveIconHrefs } from "@/lib/branding/resolve-icon-hrefs";

describe("branding fallback helpers", () => {
  it("appends version query to asset URL", () => {
    expect(
      appendVersionToAssetUrl(
        "https://example.com/storage/logo.png",
        "1748100012",
      ),
    ).toBe("https://example.com/storage/logo.png?v=1748100012");
  });

  it("uses uploaded logo with version for header", () => {
    const src = resolveHeaderLogoSrc({
      logoUrl: "https://cdn.example.com/logo.svg",
      logoVersion: "1748100012",
    });

    expect(src).toBe("https://cdn.example.com/logo.svg?v=1748100012");
  });

  it("falls back to static header logo when no uploaded logo exists", () => {
    expect(resolveHeaderLogoSrc({ logoUrl: null, logoVersion: null })).toBe(
      "/logo.png",
    );
  });

  it("returns icon list with dynamic logo first and static fallbacks always present", () => {
    const icons = resolveIconHrefs({
      logoUrl: "https://cdn.example.com/logo.png",
      logoVersion: "1748100012",
    });

    expect(icons[0]).toBe("https://cdn.example.com/logo.png?v=1748100012");
    expect(icons).toContain(ICON_FALLBACK_SRC);
    expect(icons).toContain(ICON_SECONDARY_FALLBACK_SRC);
  });

  it("returns only static icon fallbacks when no uploaded logo exists", () => {
    const icons = resolveIconHrefs(null);

    expect(icons).toEqual([ICON_FALLBACK_SRC, ICON_SECONDARY_FALLBACK_SRC]);
  });
});
