// Re-export Prisma enums for now (will be replaced with custom enums later)
// Custom enums (previously from Prisma)
export enum BookingStatusEnum {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export enum DayOfWeekEnum {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
}

export enum UserRoleEnum {
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum CarStatusEnum {
  AVAILABLE = "AVAILABLE",
  SOLD = "SOLD",
  UNAVAILABLE = "UNAVAILABLE",
}

// Utility types
type DateToString<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};

// User type (extended from Prisma User)
export interface User {
  id: string;
  supabaseAuthUserId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  phone: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  role: UserRole;
}

type UserSelection = Pick<User, "id" | "name" | "email" | "imageUrl" | "phone">;

// Car type (extended from Prisma Car)
export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number; // Will be decimal/string from Supabase
  mileage: number;
  color: string;
  fuelType: string;
  transmission: string;
  bodyType: string;
  seats: number | null;
  description: string;
  status: CarStatus;
  featured: boolean;
  images: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// TestDriveBooking type
export interface TestDriveBooking {
  id: string;
  carId: string;
  userId: string;
  bookingDate: Date | string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// DealershipInfo type
export interface DealershipInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  workingHours?: WorkingHour[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// WorkingHour type
export interface WorkingHour {
  id: string;
  dealershipId: string;
  dayOfWeek: DayOfWeek;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Car related types
export type SerializedCar = DateToString<
  Omit<Car, "price"> & { price: number }
> & {
  wishlisted?: boolean;
};

// Test drive related types
type SerializedTestDriveBooking = DateToString<TestDriveBooking>;

export type TestDriveBookingWithCar = SerializedTestDriveBooking & {
  car: SerializedCar;
};

export type TestDriveBookingWithUser = TestDriveBookingWithCar & {
  user: UserSelection;
};

export type UserTestDrive = Pick<
  SerializedTestDriveBooking,
  "id" | "status" | "bookingDate"
>;

// Dealership related types
export type SerializedWorkingHour = DateToString<WorkingHour>;

export type SerializedDealershipInfo = DateToString<DealershipInfo> & {
  workingHours: SerializedWorkingHour[];
};

// Filter types
export interface CarFilters {
  search?: string;
  make?: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "newest" | "priceAsc" | "priceDesc";
  page?: number;
  limit?: number;
}

// Response types
export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CarFiltersData {
  makes: string[];
  bodyTypes: string[];
  fuelTypes: string[];
  transmissions: string[];
  priceRange: {
    min: number;
    max: number;
  };
}

// Dashboard types
export interface DashboardData {
  cars: {
    total: number;
    available: number;
    sold: number;
    unavailable: number;
    featured: number;
  };
  testDrives: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
    conversionRate: number;
  };
}

// Admin types
export type AdminAuthResult =
  | { authorized: true; user: User }
  | { authorized: false; reason?: string };

// Test drive form data
export interface TestDriveFormData {
  carId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

// Working hour input
export interface WorkingHourInput {
  dayOfWeek: DayOfWeekEnum;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

// Re-export enums for convenience (aliases for the custom enums defined above)
export type BookingStatus = BookingStatusEnum;
export type DayOfWeek = DayOfWeekEnum;
export type UserRole = UserRoleEnum;
export type CarStatus = CarStatusEnum;
