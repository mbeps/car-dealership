import type { Car } from "./car";

/**
 * Raw car row returned from Supabase before relation normalisation.
 * Keeps nested relation payloads and wishlist flags available for server-side normalization.
 */
export interface RawSupabaseCar extends Omit<Car, "make" | "color" | "price"> {
  /** Optional vehicle make name from a relation payload. */
  make?: string;
  /** Optional vehicle color label from a relation payload. */
  color?: string;
  /** Whether this listing was wishlisted by the current user. */
  wishlisted?: boolean;
  /** Lowercase make relation payload, when selected. */
  carMake?: { id: string; name: string; slug: string } | null;
  /** Upper-case make relation payload, when present in legacy queries. */
  CarMake?: { id: string; name: string; slug: string } | null;
  /** Lowercase color relation payload, when selected. */
  carColor?: { id: string; name: string; slug: string } | null;
  /** Upper-case color relation payload, when present in legacy queries. */
  CarColor?: { id: string; name: string; slug: string } | null;
  /** Raw price value from Supabase before normalisation. */
  price: string | number;
}
