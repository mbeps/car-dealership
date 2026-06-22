import "@testing-library/jest-dom/vitest";

// Mock environment variables required by lib/env.ts
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
process.env.SUPABASE_SECRET_KEY = "test-secret-key";
process.env.ARCJET_KEY = "test-arcjet-key";
