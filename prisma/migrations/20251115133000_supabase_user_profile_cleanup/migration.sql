-- Migration: align User profiles with Supabase Auth best practices
-- 1. Remove the legacy Clerk column
-- 2. Ensure ids are generated when the app does not supply one
-- 3. Enforce a one-to-one relationship with auth.users

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop unused Clerk column/indexes left from the previous auth provider
DROP INDEX IF EXISTS "User_clerkUserId_key";
ALTER TABLE "User"
  DROP COLUMN IF EXISTS "clerkUserId";

-- Generate primary keys server-side when inserts omit the column
ALTER TABLE "User"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- Ensure every Supabase auth user maps to exactly one profile row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'User_supabaseAuthUserId_key'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_supabaseAuthUserId_key"
      UNIQUE ("supabaseAuthUserId");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'User_supabaseAuthUserId_fkey'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_supabaseAuthUserId_fkey"
      FOREIGN KEY ("supabaseAuthUserId")
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;
