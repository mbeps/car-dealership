import { DealershipInfo } from "./dealership-info";
import { SerializedWorkingHour } from "./serialized-working-hour";

/**
 * Serialized dealership info with working hours
 */
export type SerializedDealershipInfo = {
  [K in keyof Omit<
    DealershipInfo,
    "workingHours" | "createdAt" | "updatedAt" | "logoUpdatedAt"
  >]: DealershipInfo[K];
} & {
  createdAt: string;
  updatedAt: string;
  logoUpdatedAt?: string | null;
  workingHours: SerializedWorkingHour[];
};
