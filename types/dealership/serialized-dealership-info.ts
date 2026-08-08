import { DealershipInfo } from "./dealership-info";
import { SerializedWorkingHour } from "./serialized-working-hour";

/**
 * Serialized dealership info with working hours.
 * Used for API responses and client components that require JSON-serialisable data.
 *
 * @see DealershipInfo - Source dealership profile
 * @see WorkingHour - Dealership opening hours
 */
export type SerializedDealershipInfo = {
  [K in keyof Omit<
    DealershipInfo,
    "workingHours" | "createdAt" | "updatedAt" | "logoUpdatedAt"
  >]: DealershipInfo[K];
} & {
  /** ISO-8601 string timestamp for record creation. */
  createdAt: string;
  /** ISO-8601 string timestamp for last update. */
  updatedAt: string;
  /** Optional ISO-8601 string timestamp for the last logo update. */
  logoUpdatedAt?: string | null;
  /** Dealership opening hours in JSON-serialisable form. */
  workingHours: SerializedWorkingHour[];
};
