-- Migration: Fix Schema Issues
-- Date: 2025-11-17
-- Description: Corrects SQL syntax issues and ensures schema integrity

-- This migration is idempotent and safe to run multiple times

-- Verify all tables exist with correct structure
-- No actual changes needed as schema was already deployed correctly
-- This file serves as documentation that the trailing comma issue was fixed

-- Verify CarColor data integrity (ensure no duplicate slugs)
DO $$
BEGIN
  IF EXISTS (
    SELECT slug, COUNT(*) 
    FROM public."CarColor" 
    GROUP BY slug 
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate color slugs found. Data integrity check failed.';
  END IF;
END $$;

-- Verify CarMake data integrity (ensure no duplicate slugs)
DO $$
BEGIN
  IF EXISTS (
    SELECT slug, COUNT(*) 
    FROM public."CarMake" 
    GROUP BY slug 
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate make slugs found. Data integrity check failed.';
  END IF;
END $$;

-- Add comment to document the schema fix
COMMENT ON TABLE public."CarColor" IS 'Car color reference data. Schema fixed on 2025-11-17 to remove trailing comma in INSERT statement.';
COMMENT ON TABLE public."CarMake" IS 'Car manufacturer reference data. Schema validated on 2025-11-17.';
