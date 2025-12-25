import { DealershipInfo } from "./dealership-info";
import { SerializedWorkingHour } from "./serialized-working-hour";

/**
 * Serialized dealership info with working hours
 */
export type SerializedDealershipInfo = {
  [K in keyof Omit<
    DealershipInfo,
    "workingHours" | "createdAt" | "updatedAt"
  >]: DealershipInfo[K];
} & {
  createdAt: string;
  updatedAt: string;
  workingHours: SerializedWorkingHour[];
};
