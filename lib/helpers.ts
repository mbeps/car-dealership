import { SerializedCar } from "@/types";

/**
 * Serializes car data from Supabase to ensure compatibility with client components
 * Converts numeric strings and dates to proper types
 */
export function serializeCarData(
  car: any,
  wishlisted?: boolean
): SerializedCar {
  return {
    ...car,
    price: typeof car.price === "string" ? parseFloat(car.price) : car.price,
    mileage:
      typeof car.mileage === "string" ? parseInt(car.mileage) : car.mileage,
    year: typeof car.year === "string" ? parseInt(car.year) : car.year,
    seats: typeof car.seats === "string" ? parseInt(car.seats) : car.seats,
    createdAt:
      typeof car.createdAt === "string"
        ? car.createdAt
        : car.createdAt.toISOString(),
    updatedAt:
      typeof car.updatedAt === "string"
        ? car.updatedAt
        : car.updatedAt.toISOString(),
    wishlisted: wishlisted ?? car.wishlisted ?? false,
  };
}

/**
 * Formats a number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
