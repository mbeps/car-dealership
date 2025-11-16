-- Grants, Row Level Security, and policies for Supabase.

-- Base privileges Supabase roles need before RLS executes.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- Enable RLS on all application tables.
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Car" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CarMake" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CarColor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserSavedCar" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TestDriveBooking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DealershipInfo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WorkingHour" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_read_own" ON public."User";
DROP POLICY IF EXISTS "user_self_update" ON public."User";
DROP POLICY IF EXISTS "user_self_insert" ON public."User";
DROP POLICY IF EXISTS "admin_delete_users" ON public."User";
DROP POLICY IF EXISTS "user_admin_read_all" ON public."User";
DROP POLICY IF EXISTS "user_admin_update" ON public."User";

CREATE POLICY "user_read_own" ON public."User"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = "supabaseAuthUserId");

CREATE POLICY "user_self_update" ON public."User"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = "supabaseAuthUserId")
  WITH CHECK (auth.uid() = "supabaseAuthUserId");

CREATE POLICY "user_self_insert" ON public."User"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = "supabaseAuthUserId");

CREATE POLICY "user_admin_read_all" ON public."User"
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "user_admin_update" ON public."User"
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_users" ON public."User"
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Car table policies -------------------------------------------------------
DROP POLICY IF EXISTS "cars_public_read" ON public."Car";
DROP POLICY IF EXISTS "cars_admin_insert" ON public."Car";
DROP POLICY IF EXISTS "cars_admin_update" ON public."Car";
DROP POLICY IF EXISTS "cars_admin_delete" ON public."Car";

CREATE POLICY "cars_public_read" ON public."Car"
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "cars_admin_insert" ON public."Car"
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "cars_admin_update" ON public."Car"
  FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "cars_admin_delete" ON public."Car"
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- CarMake table policies ---------------------------------------------------
DROP POLICY IF EXISTS "car_makes_public_read" ON public."CarMake";
DROP POLICY IF EXISTS "car_makes_admin_insert" ON public."CarMake";
DROP POLICY IF EXISTS "car_makes_admin_update" ON public."CarMake";
DROP POLICY IF EXISTS "car_makes_admin_delete" ON public."CarMake";

CREATE POLICY "car_makes_public_read" ON public."CarMake"
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "car_makes_admin_insert" ON public."CarMake"
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "car_makes_admin_update" ON public."CarMake"
  FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "car_makes_admin_delete" ON public."CarMake"
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- CarColor table policies --------------------------------------------------
DROP POLICY IF EXISTS "car_colors_public_read" ON public."CarColor";
DROP POLICY IF EXISTS "car_colors_admin_insert" ON public."CarColor";
DROP POLICY IF EXISTS "car_colors_admin_update" ON public."CarColor";
DROP POLICY IF EXISTS "car_colors_admin_delete" ON public."CarColor";

CREATE POLICY "car_colors_public_read" ON public."CarColor"
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "car_colors_admin_insert" ON public."CarColor"
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "car_colors_admin_update" ON public."CarColor"
  FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "car_colors_admin_delete" ON public."CarColor"
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- UserSavedCar policies ----------------------------------------------------
DROP POLICY IF EXISTS "saved_cars_owner_read" ON public."UserSavedCar";
DROP POLICY IF EXISTS "saved_cars_owner_insert" ON public."UserSavedCar";
DROP POLICY IF EXISTS "saved_cars_owner_delete" ON public."UserSavedCar";

CREATE POLICY "saved_cars_owner_read" ON public."UserSavedCar"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = "UserSavedCar"."userId"
        AND u."supabaseAuthUserId" = auth.uid()
    )
  );

CREATE POLICY "saved_cars_owner_insert" ON public."UserSavedCar"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = "UserSavedCar"."userId"
        AND u."supabaseAuthUserId" = auth.uid()
    )
  );

CREATE POLICY "saved_cars_owner_delete" ON public."UserSavedCar"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = "UserSavedCar"."userId"
        AND u."supabaseAuthUserId" = auth.uid()
    )
  );

-- TestDriveBooking policies ------------------------------------------------
DROP POLICY IF EXISTS "bookings_read" ON public."TestDriveBooking";
DROP POLICY IF EXISTS "bookings_create" ON public."TestDriveBooking";
DROP POLICY IF EXISTS "bookings_update" ON public."TestDriveBooking";
DROP POLICY IF EXISTS "bookings_delete" ON public."TestDriveBooking";

CREATE POLICY "bookings_read" ON public."TestDriveBooking"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = "TestDriveBooking"."userId"
        AND u."supabaseAuthUserId" = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "bookings_create" ON public."TestDriveBooking"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = "TestDriveBooking"."userId"
        AND u."supabaseAuthUserId" = auth.uid()
    )
  );

CREATE POLICY "bookings_update" ON public."TestDriveBooking"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = "TestDriveBooking"."userId"
        AND u."supabaseAuthUserId" = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "bookings_delete" ON public."TestDriveBooking"
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- DealershipInfo policies --------------------------------------------------
DROP POLICY IF EXISTS "dealership_read" ON public."DealershipInfo";
DROP POLICY IF EXISTS "dealership_admin_insert" ON public."DealershipInfo";
DROP POLICY IF EXISTS "dealership_admin_update" ON public."DealershipInfo";
DROP POLICY IF EXISTS "dealership_admin_delete" ON public."DealershipInfo";

CREATE POLICY "dealership_read" ON public."DealershipInfo"
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "dealership_admin_insert" ON public."DealershipInfo"
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "dealership_admin_update" ON public."DealershipInfo"
  FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "dealership_admin_delete" ON public."DealershipInfo"
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- WorkingHour policies -----------------------------------------------------
DROP POLICY IF EXISTS "hours_read" ON public."WorkingHour";
DROP POLICY IF EXISTS "hours_admin_insert" ON public."WorkingHour";
DROP POLICY IF EXISTS "hours_admin_update" ON public."WorkingHour";
DROP POLICY IF EXISTS "hours_admin_delete" ON public."WorkingHour";

CREATE POLICY "hours_read" ON public."WorkingHour"
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "hours_admin_insert" ON public."WorkingHour"
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "hours_admin_update" ON public."WorkingHour"
  FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "hours_admin_delete" ON public."WorkingHour"
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Note: storage bucket policies must be created inside the storage schema
-- via the Supabase Dashboard. Keep the app-level policies in sync if you
-- add new tables.
