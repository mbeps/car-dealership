-- Supabase Local Seed Data
-- Automatically applied during `supabase db reset`

-- =============================================================================
-- 1. Dealership Information & Working Hours (Singleton Configuration)
-- =============================================================================

INSERT INTO public."DealershipInfo" (
  "id",
  "name",
  "address",
  "phone",
  "email",
  "whatsappPhone"
)
VALUES (
  'dealership-default',
  'Maruf Motors',
  '69 Car Street, Autoville, CA 69420',
  '+1 (555) 123-4567',
  'contact@maruf-motors.com',
  '+1 (555) 123-4567'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."WorkingHour" ("dealershipId", "dayOfWeek", "openTime", "closeTime", "isOpen")
VALUES
  ('dealership-default', 'MONDAY', '09:00', '18:00', true),
  ('dealership-default', 'TUESDAY', '09:00', '18:00', true),
  ('dealership-default', 'WEDNESDAY', '09:00', '18:00', true),
  ('dealership-default', 'THURSDAY', '09:00', '18:00', true),
  ('dealership-default', 'FRIDAY', '09:00', '18:00', true),
  ('dealership-default', 'SATURDAY', '10:00', '16:00', true),
  ('dealership-default', 'SUNDAY', '00:00', '00:00', false)
ON CONFLICT ("dealershipId", "dayOfWeek") DO NOTHING;

-- =============================================================================
-- 2. Home Page Content (Singleton Configuration)
-- =============================================================================

INSERT INTO public."HomePageContent" (
  "id",
  "heroTitle",
  "heroSubtitle",
  "feature1Title",
  "feature1Description",
  "feature2Title",
  "feature2Description",
  "feature3Title",
  "feature3Description",
  "ctaTitle",
  "ctaSubtitle"
)
VALUES (
  'home-content-default',
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

-- =============================================================================
-- 3. Frequently Asked Questions (FAQ)
-- =============================================================================

INSERT INTO public."FAQ" ("id", "question", "answer", "order")
VALUES
  (
    'faq-1',
    'How do I schedule a test drive?',
    'Select a vehicle from our inventory and click "Book Test Drive" to choose an available date and time slot that suits your schedule.',
    1
  ),
  (
    'faq-2',
    'What documents do I need to bring for a test drive?',
    'Please bring a valid driver license and proof of insurance when attending your scheduled test drive appointment.',
    2
  ),
  (
    'faq-3',
    'Can I cancel or reschedule my test drive booking?',
    'Yes, you can easily manage, cancel, or reschedule your bookings through your user profile dashboard.',
    3
  ),
  (
    'faq-4',
    'Are all listed vehicles inspected?',
    'Yes, every vehicle in our inventory undergoes a comprehensive mechanical and safety inspection before being listed.',
    4
  )
ON CONFLICT ("id") DO NOTHING;

-- =============================================================================
-- 4. Sample Inventory Cars (Featured & Available)
-- =============================================================================

DO $$
DECLARE
  v_bmw_id TEXT;
  v_audi_id TEXT;
  v_tesla_id TEXT;
  v_black_id TEXT;
  v_white_id TEXT;
  v_silver_id TEXT;
BEGIN
  SELECT id INTO v_bmw_id FROM public."CarMake" WHERE slug = 'bmw' LIMIT 1;
  SELECT id INTO v_audi_id FROM public."CarMake" WHERE slug = 'audi' LIMIT 1;
  SELECT id INTO v_tesla_id FROM public."CarMake" WHERE slug = 'tesla' LIMIT 1;

  SELECT id INTO v_black_id FROM public."CarColor" WHERE slug = 'black' LIMIT 1;
  SELECT id INTO v_white_id FROM public."CarColor" WHERE slug = 'white' LIMIT 1;
  SELECT id INTO v_silver_id FROM public."CarColor" WHERE slug = 'silver' LIMIT 1;

  IF v_bmw_id IS NOT NULL AND v_black_id IS NOT NULL THEN
    INSERT INTO public."Car" (
      "id",
      "carMakeId",
      "carColorId",
      "model",
      "year",
      "price",
      "mileage",
      "fuelType",
      "transmission",
      "bodyType",
      "numberPlate",
      "seats",
      "description",
      "status",
      "featured",
      "features",
      "images"
    )
    VALUES (
      'car-sample-bmw-m3',
      v_bmw_id,
      v_black_id,
      'M3 Competition',
      2024,
      78500.00,
      4200,
      'Petrol',
      'Automatic',
      'Sedan',
      'MM24 BMW',
      5,
      'Pristine 2024 BMW M3 Competition in Sapphire Black. Fully equipped with executive package, carbon fiber trim, and premium audio.',
      'AVAILABLE',
      true,
      ARRAY['Leather Seats', 'Navigation System', 'Bluetooth', 'Backup Camera', 'Heated Seats', 'Sunroof'],
      ARRAY['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80']
    )
    ON CONFLICT ("id") DO NOTHING;
  END IF;

  IF v_audi_id IS NOT NULL AND v_silver_id IS NOT NULL THEN
    INSERT INTO public."Car" (
      "id",
      "carMakeId",
      "carColorId",
      "model",
      "year",
      "price",
      "mileage",
      "fuelType",
      "transmission",
      "bodyType",
      "numberPlate",
      "seats",
      "description",
      "status",
      "featured",
      "features",
      "images"
    )
    VALUES (
      'car-sample-audi-rs6',
      v_audi_id,
      v_silver_id,
      'RS6 Avant',
      2023,
      89900.00,
      9500,
      'Petrol',
      'Automatic',
      'Estate',
      'MM23 AUD',
      5,
      'Stunning high-performance Audi RS6 Avant with twin-turbo V8, quattro all-wheel drive, and dynamic ride control.',
      'AVAILABLE',
      true,
      ARRAY['All-Wheel Drive', 'Panoramic Sunroof', 'Navigation System', 'Adaptive Cruise Control', 'Lane Assist'],
      ARRAY['https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80']
    )
    ON CONFLICT ("id") DO NOTHING;
  END IF;

  IF v_tesla_id IS NOT NULL AND v_white_id IS NOT NULL THEN
    INSERT INTO public."Car" (
      "id",
      "carMakeId",
      "carColorId",
      "model",
      "year",
      "price",
      "mileage",
      "fuelType",
      "transmission",
      "bodyType",
      "numberPlate",
      "seats",
      "description",
      "status",
      "featured",
      "features",
      "images"
    )
    VALUES (
      'car-sample-tesla-model-s',
      v_tesla_id,
      v_white_id,
      'Model S Plaid',
      2024,
      84990.00,
      3100,
      'Electric',
      'Automatic',
      'Saloon',
      'MM24 TSL',
      5,
      'Tri-motor all-wheel drive Tesla Model S Plaid offering blistering acceleration, yoke steering, and full self-driving capability.',
      'AVAILABLE',
      true,
      ARRAY['Electric', 'Autopilot', 'Premium Audio', 'Heated Seats', 'Glass Roof', 'Wireless Charging'],
      ARRAY['https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80']
    )
    ON CONFLICT ("id") DO NOTHING;
  END IF;
END $$;
