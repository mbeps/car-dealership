import { describe, expect, it } from "vitest";
import {
  buildAuthCallbackRedirectUrl,
  getSafeRedirectPath,
} from "@/lib/route/safe-redirect";

describe("getSafeRedirectPath", () => {
  it("returns fallback when input is empty or null", () => {
    expect(getSafeRedirectPath(undefined)).toBe("/");
    expect(getSafeRedirectPath(null)).toBe("/");
    expect(getSafeRedirectPath("")).toBe("/");
    expect(getSafeRedirectPath("   ")).toBe("/");
  });

  it("returns safe internal paths untouched", () => {
    expect(getSafeRedirectPath("/admin")).toBe("/admin");
    expect(getSafeRedirectPath("/saved-cars")).toBe("/saved-cars");
  });

  it("preserves query parameters and fragments", () => {
    expect(
      getSafeRedirectPath(
        "/oauth/consent?authorization_id=123e4567-e89b-12d3-a456-426614174000",
      ),
    ).toBe(
      "/oauth/consent?authorization_id=123e4567-e89b-12d3-a456-426614174000",
    );

    expect(getSafeRedirectPath("/cars?brand=Toyota&price=30000#section")).toBe(
      "/cars?brand=Toyota&price=30000#section",
    );
  });

  it("rejects open redirect and protocol-relative attempts", () => {
    expect(getSafeRedirectPath("//evil.com")).toBe("/");
    expect(getSafeRedirectPath("//evil.com/oauth/consent")).toBe("/");
    expect(getSafeRedirectPath("https://evil.com")).toBe("/");
    expect(getSafeRedirectPath("http://evil.com")).toBe("/");
    expect(getSafeRedirectPath("javascript:alert(1)")).toBe("/");
    expect(getSafeRedirectPath("/\\evil.com")).toBe("/");
  });

  it("rejects paths containing spaces or control characters", () => {
    expect(getSafeRedirectPath("/test\nurl")).toBe("/");
    expect(getSafeRedirectPath("/test url")).toBe("/");
  });

  it("uses custom fallback if provided", () => {
    expect(getSafeRedirectPath("invalid", "/custom-fallback")).toBe(
      "/custom-fallback",
    );
    expect(getSafeRedirectPath("//evil.com", "/custom-fallback")).toBe(
      "/custom-fallback",
    );
  });
});

describe("buildAuthCallbackRedirectUrl", () => {
  it("builds correct URL with encoded redirect parameter", () => {
    const siteUrl = "https://car-dealership.maruf-bepary.com";
    const redirect = "/oauth/consent?authorization_id=abc-123&client_id=gemini";

    const result = buildAuthCallbackRedirectUrl(siteUrl, redirect);
    expect(result).toBe(
      "https://car-dealership.maruf-bepary.com/auth/callback?redirect=%2Foauth%2Fconsent%3Fauthorization_id%3Dabc-123%26client_id%3Dgemini",
    );
  });

  it("strips trailing slashes from siteUrl", () => {
    const siteUrl = "https://car-dealership.maruf-bepary.com///";
    const redirect = "/admin/cars";

    const result = buildAuthCallbackRedirectUrl(siteUrl, redirect);
    expect(result).toBe(
      "https://car-dealership.maruf-bepary.com/auth/callback?redirect=%2Fadmin%2Fcars",
    );
  });

  it("falls back to / if redirect path is invalid", () => {
    const siteUrl = "https://car-dealership.maruf-bepary.com";
    const redirect = "https://evil.com";

    const result = buildAuthCallbackRedirectUrl(siteUrl, redirect);
    expect(result).toBe(
      "https://car-dealership.maruf-bepary.com/auth/callback?redirect=%2F",
    );
  });
});
