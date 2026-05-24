-- Adds dealership branding logo metadata and storage policies.

ALTER TABLE public."DealershipInfo"
  ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "logoPath" TEXT,
  ADD COLUMN IF NOT EXISTS "logoVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "logoMimeType" TEXT,
  ADD COLUMN IF NOT EXISTS "logoSizeBytes" INTEGER,
  ADD COLUMN IF NOT EXISTS "logoUpdatedAt" TIMESTAMP WITHOUT TIME ZONE;

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('branding-assets', 'branding-assets', TRUE)
  ON CONFLICT (id) DO UPDATE
    SET public = EXCLUDED.public;
END $$;

DROP POLICY IF EXISTS "branding_assets_public_read" ON storage.objects;
DROP POLICY IF EXISTS "branding_assets_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "branding_assets_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "branding_assets_admin_delete" ON storage.objects;

CREATE POLICY "branding_assets_public_read" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'branding-assets');

CREATE POLICY "branding_assets_admin_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'branding-assets'
    AND public.is_admin()
  );

CREATE POLICY "branding_assets_admin_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'branding-assets'
    AND public.is_admin()
  );

CREATE POLICY "branding_assets_admin_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'branding-assets'
    AND public.is_admin()
  );
