/**
 * ENUMS - Shared between TypeORM entities and TypeScript types
 */
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

/**
 * TYPE ALIASES - Export enums for backward compatibility
 */
export type BookingStatus = BookingStatusEnum;
export type DayOfWeek = DayOfWeekEnum;
export type UserRole = UserRoleEnum;
export type CarStatus = CarStatusEnum;

/**
 * UTILITY TYPES
 */
type DateToString<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};

/**
 * ENTITY TYPE IMPORTS - Import types from TypeORM entities
 * These replace the old interface definitions with entity-based types
 */
import type {
  User as UserEntity,
  Car as CarEntity,
  CarMake as CarMakeEntity,
  CarColor as CarColorEntity,
  TestDriveBooking as TestDriveBookingEntity,
  DealershipInfo as DealershipInfoEntity,
  WorkingHour as WorkingHourEntity,
} from "@/db/entities";

/**
 * EXPORTED TYPES - Serializable versions for API responses
 * Converts Date fields to strings for JSON serialization
 */
export type User = DateToString<UserEntity>;
export type Car = DateToString<CarEntity> & {
  make: string; // Flattened from relation
  color: string; // Flattened from relation
};
export type CarMake = DateToString<CarMakeEntity>;
export type CarColor = DateToString<CarColorEntity>;
export type TestDriveBooking = DateToString<TestDriveBookingEntity>;
export type DealershipInfo = DateToString<DealershipInfoEntity> & {
  workingHours?: WorkingHour[];
};
export type WorkingHour = DateToString<WorkingHourEntity>;

/**
 * DERIVED TYPES
 */
type UserSelection = Pick<User, "id" | "name" | "email" | "imageUrl" | "phone">;

export type CarMakeOption = Pick<CarMake, "id" | "name" | "slug"> & {
  country?: string | null;
};

export type CarColorOption = Pick<CarColor, "id" | "name" | "slug">;

/**
 * SERIALIZED TYPES - For API responses with additional computed fields
 */
export type SerializedCar = Car & {
  wishlisted?: boolean;
};

export type SerializedTestDriveBooking = TestDriveBooking;

export type TestDriveBookingWithCar = Omit<TestDriveBooking, "car" | "user"> & {
  car: SerializedCar;
};

export type TestDriveBookingWithUser = Omit<
  TestDriveBooking,
  "car" | "user"
> & {
  car: SerializedCar;
  user: UserSelection;
};

export type UserTestDrive = Pick<
  SerializedTestDriveBooking,
  "id" | "status" | "bookingDate"
>;

// Dealership related types (already serialized via DateToString)
export type SerializedWorkingHour = WorkingHour;
export type SerializedDealershipInfo = DealershipInfo;

// Filter types
export interface CarFilters {
  search?: string;
  make?: string;
  color?: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  minAge?: number;
  maxAge?: number;
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
  makes: CarMakeOption[];
  colors: CarColorOption[];
  bodyTypes: string[];
  fuelTypes: string[];
  transmissions: string[];
  priceRange: {
    min: number;
    max: number;
  };
  mileageRange: {
    min: number;
    max: number;
  };
  ageRange: {
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
