-- Utility functions and triggers relied on by the application.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW."updatedAt" = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_User ON public."User";
CREATE TRIGGER set_updated_at_User
BEFORE UPDATE ON public."User"
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
