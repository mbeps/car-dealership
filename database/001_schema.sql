-- Base schema for the Supabase Vehiql project.
-- Run this on a fresh database to provision all enums, tables, and indexes.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enumerations --------------------------------------------------------------
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "CarStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'SOLD');
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- Tables -------------------------------------------------------------------
CREATE TABLE public."User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "supabaseAuthUserId" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "imageUrl" TEXT,
  "phone" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('utc', now()),
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('utc', now()),
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  CONSTRAINT "User_email_key" UNIQUE ("email"),
  CONSTRAINT "User_supabaseAuthUserId_key" UNIQUE ("supabaseAuthUserId"),
  CONSTRAINT "User_supabaseAuthUserId_fkey"
    FOREIGN KEY ("supabaseAuthUserId")
    REFERENCES auth.users (id)
    ON DELETE CASCADE
);

CREATE TABLE public."CarMake" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "country" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT "CarMake_name_key" UNIQUE ("name"),
  CONSTRAINT "CarMake_slug_key" UNIQUE ("slug")
);

CREATE TABLE public."CarColor" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT "CarColor_name_key" UNIQUE ("name"),
  CONSTRAINT "CarColor_slug_key" UNIQUE ("slug")
);

CREATE TABLE public."Car" (
  "id" TEXT PRIMARY KEY,
  "carMakeId" TEXT NOT NULL,
  "carColorId" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "price" NUMERIC(10, 2) NOT NULL,
  "mileage" INTEGER NOT NULL,
  "fuelType" TEXT NOT NULL,
  "transmission" TEXT NOT NULL,
  "bodyType" TEXT NOT NULL,
  "numberPlate" TEXT NOT NULL,
  "seats" INTEGER,
  "description" TEXT NOT NULL,
  "status" "CarStatus" NOT NULL DEFAULT 'AVAILABLE',
  "featured" BOOLEAN NOT NULL DEFAULT FALSE,
  "features" TEXT[],
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('utc', now()),
  "images" TEXT[],
  CONSTRAINT "Car_carMakeId_fkey"
    FOREIGN KEY ("carMakeId")
    REFERENCES public."CarMake"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE
    ,
  CONSTRAINT "Car_carColorId_fkey"
    FOREIGN KEY ("carColorId")
    REFERENCES public."CarColor"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE TABLE public."DealershipInfo" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL DEFAULT 'Vehiql Motors',
  "address" TEXT NOT NULL DEFAULT '69 Car Street, Autoville, CA 69420',
  "phone" TEXT NOT NULL DEFAULT '+1 (555) 123-4567',
  "email" TEXT NOT NULL DEFAULT 'contact@vehiql.com',
  "whatsappPhone" TEXT NOT NULL DEFAULT '+1 (555) 123-4567',
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public."WorkingHour" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "dealershipId" TEXT NOT NULL,
  "dayOfWeek" "DayOfWeek" NOT NULL,
  "openTime" TEXT NOT NULL,
  "closeTime" TEXT NOT NULL,
  "isOpen" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT "WorkingHour_dealershipId_fkey"
    FOREIGN KEY ("dealershipId")
    REFERENCES public."DealershipInfo"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT "WorkingHour_dealershipId_dayOfWeek_key"
    UNIQUE ("dealershipId", "dayOfWeek")
);

CREATE TABLE public."UserSavedCar" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "carId" TEXT NOT NULL,
  "savedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT "UserSavedCar_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES public."User"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT "UserSavedCar_carId_fkey"
    FOREIGN KEY ("carId")
    REFERENCES public."Car"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT "UserSavedCar_userId_carId_key"
    UNIQUE ("userId", "carId")
);

CREATE TABLE public."TestDriveBooking" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "carId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bookingDate" DATE NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT "TestDriveBooking_carId_fkey"
    FOREIGN KEY ("carId")
    REFERENCES public."Car"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT "TestDriveBooking_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES public."User"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

-- Indexes ------------------------------------------------------------------
CREATE INDEX "Car_carMakeId_model_idx" ON public."Car"("carMakeId", "model");
CREATE INDEX "Car_bodyType_idx" ON public."Car"("bodyType");
CREATE INDEX "Car_price_idx" ON public."Car"("price");
CREATE INDEX "Car_year_idx" ON public."Car"("year");
CREATE INDEX "Car_status_idx" ON public."Car"("status");
CREATE INDEX "Car_fuelType_idx" ON public."Car"("fuelType");
CREATE INDEX "Car_featured_idx" ON public."Car"("featured");
CREATE INDEX "Car_carMakeId_idx" ON public."Car"("carMakeId");
CREATE INDEX "Car_carColorId_idx" ON public."Car"("carColorId");

-- Index for quick lookups by number plate
CREATE INDEX "Car_numberPlate_idx" ON public."Car"("numberPlate");

CREATE INDEX "UserSavedCar_userId_idx" ON public."UserSavedCar"("userId");
CREATE INDEX "UserSavedCar_carId_idx" ON public."UserSavedCar"("carId");

CREATE INDEX "TestDriveBooking_carId_idx" ON public."TestDriveBooking"("carId");
CREATE INDEX "TestDriveBooking_userId_idx" ON public."TestDriveBooking"("userId");
CREATE INDEX "TestDriveBooking_bookingDate_idx" ON public."TestDriveBooking"("bookingDate");
CREATE INDEX "TestDriveBooking_status_idx" ON public."TestDriveBooking"("status");
CREATE UNIQUE INDEX "TestDriveBooking_unique_slot"
  ON public."TestDriveBooking" ("carId", "bookingDate", "startTime")
  WHERE "status" IN ('PENDING', 'CONFIRMED');

CREATE INDEX "WorkingHour_dealershipId_idx" ON public."WorkingHour"("dealershipId");
CREATE INDEX "WorkingHour_dayOfWeek_idx" ON public."WorkingHour"("dayOfWeek");
CREATE INDEX "WorkingHour_isOpen_idx" ON public."WorkingHour"("isOpen");

INSERT INTO public."CarMake" ("name", "slug", "country")
VALUES
  ('Abarth', 'abarth', 'Italy'),
  ('Alfa Romeo', 'alfa-romeo', 'Italy'),
  ('Aston Martin', 'aston-martin', 'United Kingdom'),
  ('Audi', 'audi', 'Germany'),
  ('Bentley', 'bentley', 'United Kingdom'),
  ('BMW', 'bmw', 'Germany'),
  ('BYD', 'byd', 'China'),
  ('Citroen', 'citroen', 'France'),
  ('Cupra', 'cupra', 'Spain'),
  ('Dacia', 'dacia', 'Romania'),
  ('DS Automobiles', 'ds-automobiles', 'France'),
  ('Ferrari', 'ferrari', 'Italy'),
  ('Fiat', 'fiat', 'Italy'),
  ('Ford', 'ford', 'United States'),
  ('Genesis', 'genesis', 'South Korea'),
  ('GWM Ora', 'gwm-ora', 'China'),
  ('Honda', 'honda', 'Japan'),
  ('Hyundai', 'hyundai', 'South Korea'),
  ('Jaguar', 'jaguar', 'United Kingdom'),
  ('Jeep', 'jeep', 'United States'),
  ('Kia', 'kia', 'South Korea'),
  ('Lamborghini', 'lamborghini', 'Italy'),
  ('Land Rover', 'land-rover', 'United Kingdom'),
  ('Lexus', 'lexus', 'Japan'),
  ('Lotus', 'lotus', 'United Kingdom'),
  ('Maserati', 'maserati', 'Italy'),
  ('Mazda', 'mazda', 'Japan'),
  ('McLaren', 'mclaren', 'United Kingdom'),
  ('Mercedes-Benz', 'mercedes-benz', 'Germany'),
  ('MG', 'mg', 'China'),
  ('Mini', 'mini', 'United Kingdom'),
  ('Mitsubishi', 'mitsubishi', 'Japan'),
  ('Nissan', 'nissan', 'Japan'),
  ('Peugeot', 'peugeot', 'France'),
  ('Polestar', 'polestar', 'Sweden'),
  ('Porsche', 'porsche', 'Germany'),
  ('Renault', 'renault', 'France'),
  ('Rolls-Royce', 'rolls-royce', 'United Kingdom'),
  ('Seat', 'seat', 'Spain'),
  ('Skoda', 'skoda', 'Czech Republic'),
  ('Smart', 'smart', 'Germany'),
  ('SsangYong', 'ssangyong', 'South Korea'),
  ('Subaru', 'subaru', 'Japan'),
  ('Suzuki', 'suzuki', 'Japan'),
  ('Tesla', 'tesla', 'United States'),
  ('Toyota', 'toyota', 'Japan'),
  ('Vauxhall', 'vauxhall', 'United Kingdom'),
  ('Volkswagen', 'volkswagen', 'Germany'),
  ('Volvo', 'volvo', 'Sweden')
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO public."CarColor" ("name", "slug")
VALUES
  ('Black', 'black'),
  ('White', 'white'),
  ('Silver', 'silver'),
  ('Gray', 'gray'),
  ('Red', 'red'),
  ('Blue', 'blue'),
  ('Green', 'green'),
  ('Yellow', 'yellow'),
  ('Orange', 'orange'),
  ('Brown', 'brown'),
  ('Beige', 'beige'),
  ('Gold', 'gold'),
  ('Purple', 'purple'),
  ('Pink', 'pink'),
  ('Gunmetal', 'gunmetal')
ON CONFLICT ("slug") DO NOTHING;
