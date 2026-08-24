import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * lib/env.ts is a module-level singleton that parses process.env at import time,
 * so each case must reset modules and re-import dynamically after stubbing env.
 */
async function importGetSiteUrl() {
  vi.resetModules();
  const mod = await import("@/lib/site-url");
  return mod.getSiteUrl;
}

describe("getSiteUrl", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    // Remove vars entirely: empty strings fail the zod URL validation in lib/env.ts
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
  });

  it("returns NEXT_PUBLIC_SITE_URL when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/");
    const getSiteUrl = await importGetSiteUrl();
    expect(getSiteUrl()).toBe("https://example.com");
  });

  it("falls back to NEXT_PUBLIC_VERCEL_URL with https prefix", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "my-app.vercel.app");
    const getSiteUrl = await importGetSiteUrl();
    expect(getSiteUrl()).toBe("https://my-app.vercel.app");
  });

  it("falls back to localhost when no env vars are set", async () => {
    const getSiteUrl = await importGetSiteUrl();
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("keeps an explicit http URL as-is", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000/");
    const getSiteUrl = await importGetSiteUrl();
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("strips a trailing slash", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/subpath/");
    const getSiteUrl = await importGetSiteUrl();
    expect(getSiteUrl()).toBe("https://example.com/subpath");
  });

  it("does not modify URLs without trailing slashes", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/subpath");
    const getSiteUrl = await importGetSiteUrl();
    expect(getSiteUrl()).toBe("https://example.com/subpath");
  });
});
