import type { RawSupabaseCar } from "@/types/car/raw-supabase-car";
import type { SerializedCar } from "@/types/car/serialized-car";

/**
 * Normalizes car data from Supabase for client components.
 *
 * Converts numeric strings to numbers, serializes dates, and flattens nested make/color relations into top-level fields.
 *
 * @param car - Raw car row from Supabase, including optional relation objects.
 * @param wishlisted - Client wishlist state to merge when present.
 * @returns Car data normalized for client components.
 */
export function serializeCarData(
  car: RawSupabaseCar,
  wishlisted?: boolean,
): SerializedCar {
  const carMakeRelation = car.carMake || car.CarMake || null;
  const carColorRelation = car.carColor || car.CarColor || null;
  const normalizedCar: RawSupabaseCar = {
    ...car,
    carMakeId: car.carMakeId ?? carMakeRelation?.id ?? "",
    make: car.make ?? carMakeRelation?.name ?? "",
    carColorId: car.carColorId ?? carColorRelation?.id ?? "",
    color: car.color ?? carColorRelation?.name ?? "",
  };
  const { carMake, CarMake, carColor, CarColor, ...rest } = normalizedCar;

  // Prevent unused var warning
  void carMake;
  void CarMake;
  void carColor;
  void CarColor;

  return {
    ...rest,
    price: typeof rest.price === "string" ? parseFloat(rest.price) : rest.price,
    mileage:
      typeof rest.mileage === "string"
        ? parseInt(rest.mileage, 10)
        : rest.mileage,
    year: typeof rest.year === "string" ? parseInt(rest.year, 10) : rest.year,
    seats:
      typeof rest.seats === "string" ? parseInt(rest.seats, 10) : rest.seats,
    createdAt:
      typeof rest.createdAt === "string"
        ? rest.createdAt
        : rest.createdAt.toISOString(),
    updatedAt:
      typeof rest.updatedAt === "string"
        ? rest.updatedAt
        : rest.updatedAt.toISOString(),
    wishlisted: wishlisted ?? rest.wishlisted ?? false,
  } as SerializedCar;
}
