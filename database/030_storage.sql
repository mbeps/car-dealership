-- Storage bucket + policies for application assets.
-- Run after the schema/policy files so public.is_admin() exists.

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('car-images', 'car-images', TRUE)
  ON CONFLICT (id) DO UPDATE
    SET public = EXCLUDED.public;
END $$;

-- Ensure predictable policies for the car-images bucket
DROP POLICY IF EXISTS "car_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "car_images_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "car_images_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "car_images_admin_delete" ON storage.objects;

CREATE POLICY "car_images_public_read" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'car-images');

CREATE POLICY "car_images_admin_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'car-images'
    AND public.is_admin()
  );

CREATE POLICY "car_images_admin_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'car-images'
    AND public.is_admin()
  );

CREATE POLICY "car_images_admin_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'car-images'
    AND public.is_admin()
  );
