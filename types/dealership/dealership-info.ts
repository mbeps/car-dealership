import { WorkingHour } from "./working-hour";

/**
 * Dealership information entity
 */
export interface DealershipInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  whatsappPhone: string;
  workingHours?: WorkingHour[];
  createdAt: Date | string;
  updatedAt: Date | string;
}
