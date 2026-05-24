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
  logoUrl?: string | null;
  logoPath?: string | null;
  logoVersion?: string | null;
  logoMimeType?: string | null;
  logoSizeBytes?: number | null;
  logoUpdatedAt?: Date | string | null;
  workingHours?: WorkingHour[];
  createdAt: Date | string;
  updatedAt: Date | string;
}
