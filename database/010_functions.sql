-- Utility functions and triggers relied on by the application.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
DECLARE
  has_updated_at BOOLEAN := to_jsonb(NEW) ? 'updatedAt';
BEGIN
  IF has_updated_at THEN
    NEW."updatedAt" = timezone('utc', now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_User ON public."User";
CREATE TRIGGER set_updated_at_User
BEFORE INSERT OR UPDATE ON public."User"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_Car ON public."Car";
CREATE TRIGGER set_updated_at_Car
BEFORE INSERT OR UPDATE ON public."Car"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_DealershipInfo ON public."DealershipInfo";
CREATE TRIGGER set_updated_at_DealershipInfo
BEFORE INSERT OR UPDATE ON public."DealershipInfo"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_WorkingHour ON public."WorkingHour";
CREATE TRIGGER set_updated_at_WorkingHour
BEFORE INSERT OR UPDATE ON public."WorkingHour"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_UserSavedCar ON public."UserSavedCar";
CREATE TRIGGER set_updated_at_UserSavedCar
BEFORE INSERT OR UPDATE ON public."UserSavedCar"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_TestDriveBooking ON public."TestDriveBooking";
CREATE TRIGGER set_updated_at_TestDriveBooking
BEFORE INSERT OR UPDATE ON public."TestDriveBooking"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Admin helper used by RLS policies. Keeps logic in one place and prevents
-- recursion when policies need to know if the caller is an admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public."User"
    WHERE "supabaseAuthUserId" = auth.uid()
      AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;
