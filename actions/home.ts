"use server";

import { db } from "@/lib/prisma";
import { SerializedCar } from "@/types";

// Function to serialize car data
function serializeCarData(car: {
  id: string;
  make: string;
  model: string;
  year: number;
  price: import("@prisma/client").Prisma.Decimal;
  mileage: number;
  color: string;
  fuelType: string;
  transmission: string;
  bodyType: string;
  seats: number | null;
  description: string;
  status: import("@prisma/client").CarStatus;
  featured: boolean;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}): SerializedCar {
  return {
    ...car,
    price: car.price ? parseFloat(car.price.toString()) : 0,
    createdAt: car.createdAt?.toISOString(),
    updatedAt: car.updatedAt?.toISOString(),
  };
}

/**
 * Get featured cars for the homepage
 */
export async function getFeaturedCars(limit = 3): Promise<SerializedCar[]> {
  try {
    const cars = await db.car.findMany({
      where: {
        featured: true,
        status: "AVAILABLE",
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return cars.map(serializeCarData);
  } catch (error) {
    throw new Error("Error fetching featured cars:" + (error as Error).message);
  }
}
