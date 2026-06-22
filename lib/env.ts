import { z } from "zod";

/**
 * Public environment variables accessible on both client and server.
 */
const clientSchema = z.object({
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
});

/**
 * Full environment variables schema including server-side secrets.
 */
const serverSchema = clientSchema.extend({
  // Supabase (Private/Server-only)
  SUPABASE_SECRET_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().optional(),

  // Security
  ARCJET_KEY: z.string().min(1),
});

const isServer = typeof window === "undefined";

// Map legacy variables and handle fallbacks before parsing
const rawEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

  SUPABASE_SECRET_KEY:
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,

  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  ARCJET_KEY: process.env.ARCJET_KEY,

  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,

  NODE_ENV: process.env.NODE_ENV,

  NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB:
    process.env.NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB,
  NEXT_PUBLIC_MAX_LOGO_SIZE_MB: process.env.NEXT_PUBLIC_MAX_LOGO_SIZE_MB,
  NEXT_PUBLIC_MAX_FAVICON_SIZE_KB: process.env.NEXT_PUBLIC_MAX_FAVICON_SIZE_KB,
};

// Validate using the appropriate schema for the environment
const schema = isServer ? serverSchema : clientSchema;
const parsed = schema.safeParse(rawEnv);

if (!parsed.success) {
  console.error(
    `Invalid environment variables on ${isServer ? "server" : "client"}:`,
    JSON.stringify(parsed.error.format(), null, 2),
  );
  throw new Error("Invalid environment variables");
}

/**
 * Exported env object.
 * Note: Server-only variables will be undefined on the client.
 */
export const env = parsed.data as z.infer<typeof serverSchema>;

/**
 * Pre-calculated byte values for file size limits.
 * Safe to use on both client and server as it only depends on public vars.
 */
export const FILE_LIMITS = {
  CAR_IMAGE: env.NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB * 1024 * 1024,
  LOGO: env.NEXT_PUBLIC_MAX_LOGO_SIZE_MB * 1024 * 1024,
  FAVICON: env.NEXT_PUBLIC_MAX_FAVICON_SIZE_KB * 1024,
} as const;
