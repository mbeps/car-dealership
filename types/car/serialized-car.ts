import { Car } from "./car";

/**
 * Car type with string dates and wishlist info
 */
export type SerializedCar = {
  [K in keyof Omit<Car, "price" | "createdAt" | "updatedAt">]: Omit<
    Car,
    "price" | "createdAt" | "updatedAt"
  >[K];
} & {
  price: number;
  createdAt: string;
  updatedAt: string;
  wishlisted?: boolean;
};
