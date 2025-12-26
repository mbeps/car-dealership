-- Migration: Add HomePageContent and FAQ tables
-- Description: Stores dynamic content for the home page hero, features, and FAQs.

-- 1. Create HomePageContent table (Singleton)
CREATE TABLE IF NOT EXISTS public."HomePageContent" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "heroTitle" TEXT NOT NULL DEFAULT 'Find your ideal car today.',
  "heroSubtitle" TEXT NOT NULL DEFAULT 'Advanced Car Search and test drive from thousands of vehicles.',
  "feature1Title" TEXT NOT NULL DEFAULT 'Wide Selection',
  "feature1Description" TEXT NOT NULL DEFAULT 'Thousands of verified vehicles from trusted dealerships and private sellers.',
  "feature2Title" TEXT NOT NULL DEFAULT 'Easy Test Drive',
  "feature2Description" TEXT NOT NULL DEFAULT 'Book a test drive online in minutes, with flexible scheduling options.',
  "feature3Title" TEXT NOT NULL DEFAULT 'Secure Process',
  "feature3Description" TEXT NOT NULL DEFAULT 'Verified listings and secure booking process for peace of mind.',
  "ctaTitle" TEXT NOT NULL DEFAULT 'Ready to Find Your Dream Car?',
  "ctaSubtitle" TEXT NOT NULL DEFAULT 'Join thousands of satisfied customers who found their perfect vehicle through our platform.',
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('utc', now()),
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('utc', now())
);

-- 2. Create FAQ table
CREATE TABLE IF NOT EXISTS public."FAQ" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('utc', now()),
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('utc', now())
);

-- 3. Enable RLS
ALTER TABLE public."HomePageContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FAQ" ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- HomePageContent: Public Read, Admin Write
DROP POLICY IF EXISTS "home_content_public_read" ON public."HomePageContent";
CREATE POLICY "home_content_public_read" ON public."HomePageContent"
  FOR SELECT TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "home_content_admin_all" ON public."HomePageContent";
CREATE POLICY "home_content_admin_all" ON public."HomePageContent"
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- FAQ: Public Read, Admin Write
DROP POLICY IF EXISTS "faq_public_read" ON public."FAQ";
CREATE POLICY "faq_public_read" ON public."FAQ"
  FOR SELECT TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "faq_admin_all" ON public."FAQ";
CREATE POLICY "faq_admin_all" ON public."FAQ"
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. Seed Data
-- Seed HomePageContent (Idempotent)
INSERT INTO public."HomePageContent" ("id", "heroTitle", "heroSubtitle", "feature1Title", "feature1Description", "feature2Title", "feature2Description", "feature3Title", "feature3Description", "ctaTitle", "ctaSubtitle")
VALUES (
  'singleton',
  'Find your ideal car today.',
  'Advanced Car Search and test drive from thousands of vehicles.',
  'Wide Selection',
  'Thousands of verified vehicles from trusted dealerships and private sellers.',
  'Easy Test Drive',
  'Book a test drive online in minutes, with flexible scheduling options.',
  'Secure Process',
  'Verified listings and secure booking process for peace of mind.',
  'Ready to Find Your Dream Car?',
  'Join thousands of satisfied customers who found their perfect vehicle through our platform.'
)
ON CONFLICT ("id") DO NOTHING;

-- Seed FAQs (Idempotent based on question text to avoid dupes on re-run, though ID is random)
-- We'll just insert if empty for safety in this migration script
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public."FAQ") THEN
    INSERT INTO public."FAQ" ("question", "answer", "order") VALUES
    ('How does the test drive booking work?', 'Simply find a car you''re interested in, click the ''Test Drive'' button, and select an available time slot. Our system will confirm your booking and provide all necessary details.', 1),
    ('How can I search for cars?', 'Use the search bar to look up makes, models, or keywords and combine it with filters like body type and price to quickly narrow down the inventory.', 2),
    ('Are all cars certified and verified?', 'All cars listed on our platform undergo a verification process. We are a trusted dealerships and verified private seller.', 3),
    ('What happens after I book a test drive?', 'After booking, you''ll receive a confirmation email with all the details. We will also contact you to confirm and provide any additional information.', 4);
  END IF;
END $$;

-- 6. Triggers for updatedAt
DROP TRIGGER IF EXISTS set_home_content_updated_at ON public."HomePageContent";
CREATE TRIGGER set_home_content_updated_at
  BEFORE UPDATE ON public."HomePageContent"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_faq_updated_at ON public."FAQ";
CREATE TRIGGER set_faq_updated_at
  BEFORE UPDATE ON public."FAQ"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
