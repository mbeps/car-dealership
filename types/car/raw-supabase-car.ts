import { Car } from "./car";

/**
 * Raw car from Supabase with nested relations
 */
export interface RawSupabaseCar extends Omit<Car, "make" | "color" | "price"> {
  make?: string;
  color?: string;
  wishlisted?: boolean;
  carMake?: { id: string; name: string; slug: string } | null;
  CarMake?: { id: string; name: string; slug: string } | null;
  carColor?: { id: string; name: string; slug: string } | null;
  CarColor?: { id: string; name: string; slug: string } | null;
  price: string | number;
}
