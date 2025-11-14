-- Ensure updatedAt columns auto-populate with UTC timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW."updatedAt" = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill null updatedAt values if any slipped in during the migration
UPDATE "User"
SET "updatedAt" = timezone('utc', now())
WHERE "updatedAt" IS NULL;

-- Provide sensible defaults for future inserts
ALTER TABLE "User"
  ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', now());

-- Keep updatedAt in sync automatically
DROP TRIGGER IF EXISTS set_updated_at_User ON "User";
CREATE TRIGGER set_updated_at_User
BEFORE UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
