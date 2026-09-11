import { z } from "zod";

/**
 * Public environment variables accessible on both client and server.
 */
export const clientEnvSchema = z.object({
  // Supabase (Public)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),

  // Site URLs
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_VERCEL_URL: z.string().optional(),

  // Environment
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // File size limits
  NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB: z.coerce.number().default(5),
  NEXT_PUBLIC_MAX_LOGO_SIZE_MB: z.coerce.number().default(1),
  NEXT_PUBLIC_MAX_FAVICON_SIZE_KB: z.coerce.number().default(256),
  NEXT_PUBLIC_TOTAL_STORAGE_LIMIT_GB: z.coerce.number().default(50),
});

/**
 * Full environment variables schema including server-side secrets.
 */
export const serverEnvSchema = clientEnvSchema.extend({
  // Supabase (Private/Server-only)
  SUPABASE_SECRET_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().optional(),

  // Security
  ARCJET_KEY: z.string().min(1),

  // Logging
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "warning", "error", "fatal"])
    .default("info")
    .transform((val) => (val === "warn" ? "warning" : val)),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type Env = ServerEnv;

const normalize = (val: unknown): unknown =>
  typeof val === "string" && val === "" ? undefined : val;

const FALLBACK_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "placeholder-publishable-key",
  SUPABASE_SECRET_KEY: "placeholder-secret-key",
  ARCJET_KEY: "placeholder-arcjet-key",
};

/**
 * Validates environment variables according to active runtime context.
 * Pass explicit process.env keys so Next.js bundlers can inline NEXT_PUBLIC_* variables.
 */
export function validateEnv(
  runtimeEnv: Record<string, unknown> = {
    NEXT_PUBLIC_SUPABASE_URL: normalize(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      normalize(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
      normalize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SECRET_KEY:
      normalize(process.env.SUPABASE_SECRET_KEY) ??
      normalize(process.env.SUPABASE_SERVICE_ROLE_KEY),
    SUPABASE_JWT_SECRET: normalize(process.env.SUPABASE_JWT_SECRET),
    ARCJET_KEY: normalize(process.env.ARCJET_KEY),
    NEXT_PUBLIC_SITE_URL: normalize(process.env.NEXT_PUBLIC_SITE_URL),
    NEXT_PUBLIC_VERCEL_URL: normalize(process.env.NEXT_PUBLIC_VERCEL_URL),
    NODE_ENV: normalize(process.env.NODE_ENV),
    NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB: normalize(
      process.env.NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB,
    ),
    NEXT_PUBLIC_MAX_LOGO_SIZE_MB: normalize(
      process.env.NEXT_PUBLIC_MAX_LOGO_SIZE_MB,
    ),
    NEXT_PUBLIC_MAX_FAVICON_SIZE_KB: normalize(
      process.env.NEXT_PUBLIC_MAX_FAVICON_SIZE_KB,
    ),
    NEXT_PUBLIC_TOTAL_STORAGE_LIMIT_GB: normalize(
      process.env.NEXT_PUBLIC_TOTAL_STORAGE_LIMIT_GB,
    ),
    LOG_LEVEL: normalize(process.env.LOG_LEVEL),
  },
  isServerEnv: boolean = typeof window === "undefined",
): Env {
  const schema = isServerEnv ? serverEnvSchema : clientEnvSchema;
  const skipValidation =
    process.env.SKIP_ENV_VALIDATION === "true" ||
    runtimeEnv.SKIP_ENV_VALIDATION === "true";

  if (skipValidation) {
    const envToValidate = {
      ...runtimeEnv,
      NEXT_PUBLIC_SUPABASE_URL:
        runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??
        FALLBACK_ENV.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        runtimeEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        FALLBACK_ENV.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      SUPABASE_SECRET_KEY:
        runtimeEnv.SUPABASE_SECRET_KEY ?? FALLBACK_ENV.SUPABASE_SECRET_KEY,
      ARCJET_KEY: runtimeEnv.ARCJET_KEY ?? FALLBACK_ENV.ARCJET_KEY,
    };

    const parsed = schema.safeParse(envToValidate);

    if (parsed.success) {
      return parsed.data as Env;
    }

    console.warn(
      `Warning: Environment validation skipped with errors on ${isServerEnv ? "server" : "client"}:`,
      JSON.stringify(z.treeifyError(parsed.error), null, 2),
    );
    return envToValidate as unknown as Env;
  }

  const parsed = schema.safeParse(runtimeEnv);

  if (!parsed.success) {
    console.error(
      `Invalid environment variables on ${isServerEnv ? "server" : "client"}:`,
      JSON.stringify(z.treeifyError(parsed.error), null, 2),
    );
    throw new Error("Invalid environment variables");
  }

  return parsed.data as Env;
}

export const env = validateEnv();

/**
 * Pre-calculated byte values for file size limits.
 *
 * Safe to use on both client and server as it only depends on public vars.
 */
export const FILE_LIMITS = {
  CAR_IMAGE: env.NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB * 1024 * 1024,
  LOGO: env.NEXT_PUBLIC_MAX_LOGO_SIZE_MB * 1024 * 1024,
  FAVICON: env.NEXT_PUBLIC_MAX_FAVICON_SIZE_KB * 1024,
  GLOBAL_STORAGE_LIMIT_BYTES:
    env.NEXT_PUBLIC_TOTAL_STORAGE_LIMIT_GB * 1024 * 1024 * 1024,
} as const;
