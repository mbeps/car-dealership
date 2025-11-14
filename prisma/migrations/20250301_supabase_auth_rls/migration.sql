-- Migration: Add Supabase Auth support and Row Level Security
-- This migration adds supabaseAuthUserId column and creates RLS policies for all tables

-- Ensure anon/authenticated roles can access the schema/tables before RLS policies run
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Add supabaseAuthUserId column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "supabaseAuthUserId" UUID;

-- Create index for performance
CREATE INDEX IF NOT EXISTS "idx_user_supabase_auth_id" ON "User"("supabaseAuthUserId");

-- Make supabaseAuthUserId unique (after data migration)
-- ALTER TABLE "User" ADD CONSTRAINT "User_supabaseAuthUserId_key" UNIQUE ("supabaseAuthUserId");

-- Enable Row Level Security on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Car" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSavedCar" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TestDriveBooking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DealershipInfo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkingHour" ENABLE ROW LEVEL SECURITY;

-- User table policies
-- Fix for infinite recursion: Allow authenticated users to read all User records
-- (RLS on other tables will prevent non-admins from doing admin actions)
DROP POLICY IF EXISTS "user_read" ON "User";
DROP POLICY IF EXISTS "user_self_update" ON "User";
DROP POLICY IF EXISTS "admin_manage_users" ON "User";
DROP POLICY IF EXISTS "user_self_insert" ON "User";

-- Allow authenticated users to read their own profile
CREATE POLICY "user_read_own" ON "User"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = "supabaseAuthUserId");

-- Allow authenticated users to read all users (needed for admin checks in other policies)
CREATE POLICY "user_read_all" ON "User"
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile only
CREATE POLICY "user_self_update" ON "User"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = "supabaseAuthUserId")
  WITH CHECK (auth.uid() = "supabaseAuthUserId");

-- Allow users to insert their own profile (for registration)
CREATE POLICY "user_self_insert" ON "User"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = "supabaseAuthUserId");

-- Create a security definer function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public."User"
    WHERE "supabaseAuthUserId" = auth.uid()
      AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Admins can delete users (using the function to avoid recursion)
CREATE POLICY "admin_delete_users" ON "User"
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Car table policies
-- Public read access for cars
DROP POLICY IF EXISTS "cars_public_read" ON "Car";
CREATE POLICY "cars_public_read" ON "Car"
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin insert access for cars
DROP POLICY IF EXISTS "cars_admin_insert" ON "Car";
CREATE POLICY "cars_admin_insert" ON "Car"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u."supabaseAuthUserId" = auth.uid()
        AND u.role = 'ADMIN'
    )
  );

-- Admin update access for cars
DROP POLICY IF EXISTS "cars_admin_update" ON "Car";
CREATE POLICY "cars_admin_update" ON "Car"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u."supabaseAuthUserId" = auth.uid()
        AND u.role = 'ADMIN'
    )
  );

-- Admin delete access for cars
DROP POLICY IF EXISTS "cars_admin_delete" ON "Car";
CREATE POLICY "cars_admin_delete" ON "Car"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u."supabaseAuthUserId" = auth.uid()
        AND u.role = 'ADMIN'
    )
  );

-- UserSavedCar table policies
-- Users can read their own saved cars
DROP POLICY IF EXISTS "saved_cars_owner_read" ON "UserSavedCar";
CREATE POLICY "saved_cars_owner_read" ON "UserSavedCar"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "UserSavedCar"."userId"
        AND u."supabaseAuthUserId" = auth.uid()
    )
  );

-- Users can save cars
DROP POLICY IF EXISTS "saved_cars_owner_insert" ON "UserSavedCar";
CREATE POLICY "saved_cars_owner_insert" ON "UserSavedCar"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "UserSavedCar"."userId"
        AND u."supabaseAuthUserId" = auth.uid()
    )
  );

-- Users can unsave cars
DROP POLICY IF EXISTS "saved_cars_owner_delete" ON "UserSavedCar";
CREATE POLICY "saved_cars_owner_delete" ON "UserSavedCar"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "UserSavedCar"."userId"
        AND u."supabaseAuthUserId" = auth.uid()
    )
  );

-- TestDriveBooking table policies
-- Users can read their own bookings, admins can read all
DROP POLICY IF EXISTS "bookings_read" ON "TestDriveBooking";
CREATE POLICY "bookings_read" ON "TestDriveBooking"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "TestDriveBooking"."userId"
        AND (u."supabaseAuthUserId" = auth.uid() OR u.role = 'ADMIN')
    ) OR
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u."supabaseAuthUserId" = auth.uid()
        AND u.role = 'ADMIN'
    )
  );

-- Users can create their own bookings
DROP POLICY IF EXISTS "bookings_create" ON "TestDriveBooking";
CREATE POLICY "bookings_create" ON "TestDriveBooking"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "TestDriveBooking"."userId"
        AND u."supabaseAuthUserId" = auth.uid()
    )
  );

-- Users can update their own bookings, admins can update all
DROP POLICY IF EXISTS "bookings_update" ON "TestDriveBooking";
CREATE POLICY "bookings_update" ON "TestDriveBooking"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "TestDriveBooking"."userId"
        AND u."supabaseAuthUserId" = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u."supabaseAuthUserId" = auth.uid()
        AND u.role = 'ADMIN'
    )
  );

-- Admins can delete bookings
DROP POLICY IF EXISTS "bookings_delete" ON "TestDriveBooking";
CREATE POLICY "bookings_delete" ON "TestDriveBooking"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u."supabaseAuthUserId" = auth.uid()
        AND u.role = 'ADMIN'
    )
  );

-- DealershipInfo table policies
-- Public read access
DROP POLICY IF EXISTS "dealership_read" ON "DealershipInfo";
CREATE POLICY "dealership_read" ON "DealershipInfo"
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin insert access
DROP POLICY IF EXISTS "dealership_admin_insert" ON "DealershipInfo";
CREATE POLICY "dealership_admin_insert" ON "DealershipInfo"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u."supabaseAuthUserId" = auth.uid()
        AND u.role = 'ADMIN'
    )
  );

-- Admin update access
DROP POLICY IF EXISTS "dealership_admin_update" ON "DealershipInfo";
CREATE POLICY "dealership_admin_update" ON "DealershipInfo"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u."supabaseAuthUserId" = auth.uid()
        AND u.role = 'ADMIN'
    )
  );

-- Admin delete access
DROP POLICY IF EXISTS "dealership_admin_delete" ON "DealershipInfo";
CREATE POLICY "dealership_admin_delete" ON "DealershipInfo"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u."supabaseAuthUserId" = auth.uid()
        AND u.role = 'ADMIN'
    )
  );

-- WorkingHour table policies
-- Public read access
DROP POLICY IF EXISTS "hours_read" ON "WorkingHour";
CREATE POLICY "hours_read" ON "WorkingHour"
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin insert access
DROP POLICY IF EXISTS "hours_admin_insert" ON "WorkingHour";
CREATE POLICY "hours_admin_insert" ON "WorkingHour"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u."supabaseAuthUserId" = auth.uid()
        AND u.role = 'ADMIN'
    )
  );

-- Admin update access
DROP POLICY IF EXISTS "hours_admin_update" ON "WorkingHour";
CREATE POLICY "hours_admin_update" ON "WorkingHour"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u."supabaseAuthUserId" = auth.uid()
        AND u.role = 'ADMIN'
    )
  );

-- Admin delete access
DROP POLICY IF EXISTS "hours_admin_delete" ON "WorkingHour";
CREATE POLICY "hours_admin_delete" ON "WorkingHour"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u."supabaseAuthUserId" = auth.uid()
        AND u.role = 'ADMIN'
    )
  );

-- Storage bucket policies for car-images
-- Note: These need to be run in the Supabase dashboard SQL editor
-- as they use storage schema which may not be accessible via Prisma migrations

-- Public read access to car images
-- INSERT INTO storage.policies (name, bucket_id, roles, operation, definition)
-- VALUES (
--   'car_images_public_read',
--   'car-images',
--   ARRAY['anon', 'authenticated'],
--   'SELECT',
--   'bucket_id = ''car-images'''
-- );

-- Admin write access to car images
-- INSERT INTO storage.policies (name, bucket_id, roles, operation, definition)
-- VALUES (
--   'car_images_admin_write',
--   'car-images',
--   ARRAY['authenticated'],
--   'INSERT',
--   'bucket_id = ''car-images'' AND EXISTS (
--     SELECT 1 FROM public."User" u
--     WHERE u.role = ''ADMIN''
--       AND u."supabaseAuthUserId" = auth.uid()
--   )'
-- );

-- Admin delete access to car images
-- INSERT INTO storage.policies (name, bucket_id, roles, operation, definition)
-- VALUES (
--   'car_images_admin_delete',
--   'car-images',
--   ARRAY['authenticated'],
--   'DELETE',
--   'bucket_id = ''car-images'' AND EXISTS (
--     SELECT 1 FROM public."User" u
--     WHERE u.role = ''ADMIN''
--       AND u."supabaseAuthUserId" = auth.uid()
--   )'
-- );
