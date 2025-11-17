import { SerializedCar } from "@/types";
import { Car } from "./entities/car.entity";

/**
 * Converts a TypeORM Car entity to SerializedCar format.
 * Handles date serialization and ensures proper type conversion.
 *
 * @param car - TypeORM Car entity
 * @param wishlisted - Whether the user has saved this car
 * @returns Serialized car data
 */
export function serializeCarEntity(
  car: Car & { carMake?: any; carColor?: any },
  wishlisted?: boolean
): SerializedCar {
  return {
    id: car.id,
    carMakeId: car.carMakeId,
    make: car.carMake?.name || "",
    carColorId: car.carColorId,
    color: car.carColor?.name || "",
    model: car.model,
    year: car.year,
    price: car.price,
    mileage: car.mileage,
    fuelType: car.fuelType,
    transmission: car.transmission,
    bodyType: car.bodyType,
    numberPlate: car.numberPlate,
    seats: car.seats,
    description: car.description,
    status: car.status,
    featured: car.featured,
    features: car.features || [],
    images: car.images || [],
    createdAt:
      typeof car.createdAt === "string"
        ? car.createdAt
        : car.createdAt.toISOString(),
    updatedAt:
      typeof car.updatedAt === "string"
        ? car.updatedAt
        : car.updatedAt.toISOString(),
    wishlisted: wishlisted ?? false,
  };
}

/**
 * Generates a unique ID for database entities.
 * Uses UUID v4 format.
 *
 * @returns UUID string
 */
export function generateId(): string {
  return crypto.randomUUID();
}
