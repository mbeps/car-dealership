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

// Car related types
export interface SerializedCar
  extends Omit<Car, "price" | "createdAt" | "updatedAt"> {
  price: number;
  createdAt: string;
  updatedAt: string;
  wishlisted?: boolean;
}

export interface CarWithWishlist extends Car {
  wishlisted: boolean;
}

// Test drive related types
export interface TestDriveBookingWithCar
  extends Omit<TestDriveBooking, "bookingDate" | "createdAt" | "updatedAt"> {
  car: SerializedCar;
  bookingDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestDriveBookingWithUser
  extends Omit<TestDriveBooking, "bookingDate" | "createdAt" | "updatedAt"> {
  car: SerializedCar;
  user: {
    id: string;
    name: string | null;
    email: string;
    imageUrl: string | null;
    phone: string | null;
  };
  bookingDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserTestDrive {
  id: string;
  status: BookingStatus;
  bookingDate: string;
}

// Dealership related types
export interface SerializedWorkingHour
  extends Omit<WorkingHour, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
}

export interface SerializedDealershipInfo
  extends Omit<DealershipInfo, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
  workingHours: SerializedWorkingHour[];
}

export interface DealershipInfoWithHours extends DealershipInfo {
  workingHours: WorkingHour[];
}

// User related types
export interface SerializedUser extends Omit<User, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
}

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
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export type ActionResponse<T> = SuccessResponse<T> | ErrorResponse;

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
export interface AdminAuthResult {
  authorized: boolean;
  user?: User;
  reason?: string;
}

// Test drive form data
export interface TestDriveFormData {
  carId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

// Car form data
export interface CarFormData {
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  color: string;
  fuelType: string;
  transmission: string;
  bodyType: string;
  seats?: number;
  description: string;
  status: string;
  featured: boolean;
}

// Working hour input
export interface WorkingHourInput {
  dayOfWeek: DayOfWeek;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}
