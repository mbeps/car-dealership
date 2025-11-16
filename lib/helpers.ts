import { SerializedCar } from "@/types";

/**
 * Normalizes car data from Supabase for client components.
 * Converts numeric strings to numbers, handles date serialization.
 * Flattens nested make/color relations into top-level fields.
 *
 * @param car - Raw car data from Supabase query
 * @param wishlisted - Whether user has saved this car
 * @returns Serialized car with proper types
 * @see SerializedCar - Return type
 */
export function serializeCarData(
  car: any,
  wishlisted?: boolean
): SerializedCar {
  const carMakeRelation = car.carMake || car.CarMake || null;
  const carColorRelation = car.carColor || car.CarColor || null;
  const normalizedCar = {
    ...car,
    carMakeId: car.carMakeId ?? carMakeRelation?.id ?? "",
    make: car.make ?? carMakeRelation?.name ?? "",
    carColorId: car.carColorId ?? carColorRelation?.id ?? "",
    color: car.color ?? carColorRelation?.name ?? "",
  };
  const { carMake, CarMake, carColor, CarColor, ...rest } = normalizedCar;

  return {
    ...rest,
    price: typeof rest.price === "string" ? parseFloat(rest.price) : rest.price,
    mileage:
      typeof rest.mileage === "string" ? parseInt(rest.mileage) : rest.mileage,
    year: typeof rest.year === "string" ? parseInt(rest.year) : rest.year,
    seats: typeof rest.seats === "string" ? parseInt(rest.seats) : rest.seats,
    createdAt:
      typeof rest.createdAt === "string"
        ? rest.createdAt
        : rest.createdAt.toISOString(),
    updatedAt:
      typeof rest.updatedAt === "string"
        ? rest.updatedAt
        : rest.updatedAt.toISOString(),
    wishlisted: wishlisted ?? rest.wishlisted ?? false,
  };
}

/**
 * Formats number as GBP currency.
 * No decimal places for car prices.
 *
 * @param amount - Numeric amount
 * @returns Formatted currency string (e.g., £25,000)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
