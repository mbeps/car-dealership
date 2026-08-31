import type { Car } from "./car";

/**
 * JSON-serialisable car listing shape used by client-side car cards and search results.
 * Converts dates to strings and ensures price is a number for stable UI rendering.
 */
export type SerializedCar = {
  /** Unique database identifier. */
  [K in keyof Omit<Car, "price" | "createdAt" | "updatedAt">]: Omit<
    Car,
    "price" | "createdAt" | "updatedAt"
  >[K];
} & {
  /** Listing price as a number. */
  price: number;
  /** Creation timestamp as a serialisable string. */
  createdAt: string;
  /** Last update timestamp as a serialisable string. */
  updatedAt: string;
  /** Whether this listing was wishlisted by the current user. */
  wishlisted?: boolean;
};
