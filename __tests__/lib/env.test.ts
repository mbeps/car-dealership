// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_JWT_SECRET",
  "ARCJET_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_VERCEL_URL",
  "NODE_ENV",
  "NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB",
  "NEXT_PUBLIC_MAX_LOGO_SIZE_MB",
  "NEXT_PUBLIC_MAX_FAVICON_SIZE_KB",
  "NEXT_PUBLIC_TOTAL_STORAGE_LIMIT_GB",
  "SKIP_ENV_VALIDATION",
] as const;

const ORIGINAL_ENV = { ...process.env };

function clearEnv() {
  for (const key of REQUIRED_ENV_VARS) {
    delete process.env[key];
  }
}

function setValidRequiredEnv() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
  process.env.SUPABASE_SECRET_KEY = "test-secret-key";
  process.env.ARCJET_KEY = "test-arcjet-key";
}

async function loadEnvModule() {
  vi.resetModules();
  return await import("@/lib/env");
}

describe("lib/env", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    clearEnv();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    clearEnv();
    Object.assign(process.env, ORIGINAL_ENV);
    vi.restoreAllMocks();
  });

  describe("when SKIP_ENV_VALIDATION is true", () => {
    beforeEach(() => {
      process.env.SKIP_ENV_VALIDATION = "true";
    });

    it("applies schema defaults and calculates FILE_LIMITS with non-NaN numbers when env vars are unset", async () => {
      const { env, FILE_LIMITS } = await loadEnvModule();

      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(
        "https://placeholder.supabase.co",
      );
      expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe(
        "placeholder-publishable-key",
      );
      expect(env.SUPABASE_SECRET_KEY).toBe("placeholder-secret-key");
      expect(env.ARCJET_KEY).toBe("placeholder-arcjet-key");

      expect(env.NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB).toBe(5);
      expect(env.NEXT_PUBLIC_MAX_LOGO_SIZE_MB).toBe(1);
      expect(env.NEXT_PUBLIC_MAX_FAVICON_SIZE_KB).toBe(256);
      expect(env.NEXT_PUBLIC_TOTAL_STORAGE_LIMIT_GB).toBe(50);
      expect(env.NODE_ENV).toBe("development");

      expect(FILE_LIMITS.CAR_IMAGE).toBe(5 * 1024 * 1024);
      expect(Number.isNaN(FILE_LIMITS.CAR_IMAGE)).toBe(false);
      expect(FILE_LIMITS.LOGO).toBe(1 * 1024 * 1024);
      expect(Number.isNaN(FILE_LIMITS.LOGO)).toBe(false);
      expect(FILE_LIMITS.FAVICON).toBe(256 * 1024);
      expect(Number.isNaN(FILE_LIMITS.FAVICON)).toBe(false);
      expect(FILE_LIMITS.GLOBAL_STORAGE_LIMIT_BYTES).toBe(
        50 * 1024 * 1024 * 1024,
      );
      expect(Number.isNaN(FILE_LIMITS.GLOBAL_STORAGE_LIMIT_BYTES)).toBe(false);
    });

    it("handles empty string environment variables by normalizing them to undefined and using fallbacks/defaults", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "";
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "";
      process.env.SUPABASE_SECRET_KEY = "";
      process.env.ARCJET_KEY = "";
      process.env.NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB = "";
      process.env.NEXT_PUBLIC_MAX_LOGO_SIZE_MB = "";
      process.env.NEXT_PUBLIC_SITE_URL = "";

      const { env, FILE_LIMITS } = await loadEnvModule();

      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(
        "https://placeholder.supabase.co",
      );
      expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe(
        "placeholder-publishable-key",
      );
      expect(env.SUPABASE_SECRET_KEY).toBe("placeholder-secret-key");
      expect(env.ARCJET_KEY).toBe("placeholder-arcjet-key");

      expect(env.NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB).toBe(5);
      expect(env.NEXT_PUBLIC_MAX_LOGO_SIZE_MB).toBe(1);
      expect(env.NEXT_PUBLIC_SITE_URL).toBeUndefined();

      expect(FILE_LIMITS.CAR_IMAGE).toBe(5 * 1024 * 1024);
      expect(Number.isNaN(FILE_LIMITS.CAR_IMAGE)).toBe(false);
    });

    it("coerces string values for numeric limits to numbers", async () => {
      process.env.NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB = "10";
      process.env.NEXT_PUBLIC_MAX_LOGO_SIZE_MB = "2";
      process.env.NEXT_PUBLIC_MAX_FAVICON_SIZE_KB = "512";
      process.env.NEXT_PUBLIC_TOTAL_STORAGE_LIMIT_GB = "100";

      const { env, FILE_LIMITS } = await loadEnvModule();

      expect(env.NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB).toBe(10);
      expect(typeof env.NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB).toBe("number");
      expect(env.NEXT_PUBLIC_MAX_LOGO_SIZE_MB).toBe(2);
      expect(typeof env.NEXT_PUBLIC_MAX_LOGO_SIZE_MB).toBe("number");
      expect(env.NEXT_PUBLIC_MAX_FAVICON_SIZE_KB).toBe(512);
      expect(typeof env.NEXT_PUBLIC_MAX_FAVICON_SIZE_KB).toBe("number");
      expect(env.NEXT_PUBLIC_TOTAL_STORAGE_LIMIT_GB).toBe(100);
      expect(typeof env.NEXT_PUBLIC_TOTAL_STORAGE_LIMIT_GB).toBe("number");

      expect(FILE_LIMITS.CAR_IMAGE).toBe(10 * 1024 * 1024);
      expect(FILE_LIMITS.LOGO).toBe(2 * 1024 * 1024);
      expect(FILE_LIMITS.FAVICON).toBe(512 * 1024);
      expect(FILE_LIMITS.GLOBAL_STORAGE_LIMIT_BYTES).toBe(
        100 * 1024 * 1024 * 1024,
      );
    });

    it("logs a warning and returns envToValidate gracefully if validation fails under skipValidation", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      // Provide an invalid enum value for NODE_ENV that fails safeParse
      process.env.NODE_ENV = "invalid-environment" as any;

      const { env } = await loadEnvModule();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Warning: Environment validation skipped with errors",
        ),
        expect.any(String),
      );
      expect(env.NODE_ENV).toBe("invalid-environment");
    });
  });

  describe("when SKIP_ENV_VALIDATION is false or unset", () => {
    it("successfully validates when all required variables are present", async () => {
      setValidRequiredEnv();

      const { env, FILE_LIMITS } = await loadEnvModule();

      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
      expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe(
        "test-publishable-key",
      );
      expect(env.SUPABASE_SECRET_KEY).toBe("test-secret-key");
      expect(env.ARCJET_KEY).toBe("test-arcjet-key");

      expect(env.NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB).toBe(5);
      expect(FILE_LIMITS.CAR_IMAGE).toBe(5 * 1024 * 1024);
    });

    it("supports legacy fallback variable names", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy-anon-key";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy-service-key";
      process.env.ARCJET_KEY = "test-arcjet-key";

      const { env } = await loadEnvModule();

      expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe("legacy-anon-key");
      expect(env.SUPABASE_SECRET_KEY).toBe("legacy-service-key");
    });

    it("coerces string limits to numbers under strict validation", async () => {
      setValidRequiredEnv();
      process.env.NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB = "8";

      const { env, FILE_LIMITS } = await loadEnvModule();

      expect(env.NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB).toBe(8);
      expect(FILE_LIMITS.CAR_IMAGE).toBe(8 * 1024 * 1024);
    });

    it("normalizes empty strings to undefined for optional fields", async () => {
      setValidRequiredEnv();
      process.env.NEXT_PUBLIC_SITE_URL = "";
      process.env.SUPABASE_JWT_SECRET = "";

      const { env } = await loadEnvModule();

      expect(env.NEXT_PUBLIC_SITE_URL).toBeUndefined();
      expect(env.SUPABASE_JWT_SECRET).toBeUndefined();
    });

    it("throws an error when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
      setValidRequiredEnv();
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(loadEnvModule()).rejects.toThrow(
        "Invalid environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid environment variables"),
        expect.any(String),
      );
    });

    it("throws an error when NEXT_PUBLIC_SUPABASE_URL is an empty string", async () => {
      setValidRequiredEnv();
      process.env.NEXT_PUBLIC_SUPABASE_URL = "";

      await expect(loadEnvModule()).rejects.toThrow(
        "Invalid environment variables",
      );
    });

    it("throws an error when NEXT_PUBLIC_SUPABASE_URL is not a valid URL", async () => {
      setValidRequiredEnv();
      process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-valid-url";

      await expect(loadEnvModule()).rejects.toThrow(
        "Invalid environment variables",
      );
    });

    it("throws an error when NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing", async () => {
      setValidRequiredEnv();
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      await expect(loadEnvModule()).rejects.toThrow(
        "Invalid environment variables",
      );
    });

    it("throws an error when SUPABASE_SECRET_KEY is missing", async () => {
      setValidRequiredEnv();
      delete process.env.SUPABASE_SECRET_KEY;

      await expect(loadEnvModule()).rejects.toThrow(
        "Invalid environment variables",
      );
    });

    it("throws an error when ARCJET_KEY is missing", async () => {
      setValidRequiredEnv();
      delete process.env.ARCJET_KEY;

      await expect(loadEnvModule()).rejects.toThrow(
        "Invalid environment variables",
      );
    });
  });

  describe("in client (browser) environment", () => {
    beforeEach(() => {
      vi.stubGlobal("window", {});
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("validates client schema without requiring server-only secrets", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";

      const { env } = await loadEnvModule();

      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
      expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe(
        "test-publishable-key",
      );
    });

    it("throws when client-required variables are missing", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";

      await expect(loadEnvModule()).rejects.toThrow(
        "Invalid environment variables",
      );
    });
  });
});
