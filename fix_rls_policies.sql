-- Fix infinite recursion in User table RLS policies
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/jxtfkekhdoshwxjjjlhi/sql

-- The issue: policies that check role = 'ADMIN' cause recursion when reading the User table
-- Solution: Allow all authenticated users to read User table, use a SECURITY DEFINER function for admin checks

-- Drop all existing User table policies
DROP POLICY IF EXISTS "user_read" ON "User";
DROP POLICY IF EXISTS "user_self_update" ON "User";
DROP POLICY IF EXISTS "admin_manage_users" ON "User";
DROP POLICY IF EXISTS "user_self_insert" ON "User";
DROP POLICY IF EXISTS "user_read_own" ON "User";
DROP POLICY IF EXISTS "user_read_all" ON "User";
DROP POLICY IF EXISTS "admin_delete_users" ON "User";

-- Ensure anon/authenticated roles have the base privileges RLS depends on
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- Allow authenticated users to read their own profile
CREATE POLICY "user_read_own" ON "User"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = "supabaseAuthUserId");

-- Allow authenticated users to read all users (needed for admin checks in other policies)
-- This prevents infinite recursion while still protecting data via RLS on other tables
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
