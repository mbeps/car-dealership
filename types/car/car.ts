import { CarStatus } from "@/enums/car-status";

/**
 * Car entity from the database
 */
export interface Car {
  id: string;
  carMakeId: string;
  carColorId: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  color: string;
  fuelType: string;
  transmission: string;
  bodyType: string;
  numberPlate: string;
  seats: number | null;
  description: string;
  status: CarStatus;
  featured: boolean;
  features: string[];
  images: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}
