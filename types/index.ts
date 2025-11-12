import {
  Car,
  TestDriveBooking,
  User,
  BookingStatus,
  DealershipInfo,
  WorkingHour,
  DayOfWeek,
  UserRole,
} from "@prisma/client";

// Utility types
type DateToString<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};

type UserSelection = Pick<User, "id" | "name" | "email" | "imageUrl" | "phone">;

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
  dayOfWeek: DayOfWeek;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

// Re-export for convenience
export type { User, BookingStatus, DayOfWeek, UserRole };
