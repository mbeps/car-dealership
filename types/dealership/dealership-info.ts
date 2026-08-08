import { WorkingHour } from "./working-hour";

/**
 * Dealership information entity.
 * Stores the dealership profile exposed to admin settings and public car pages.
 */
export interface DealershipInfo {
  /** Primary key for the dealership profile. */
  id: string;
  /** Dealership display name used in public branding and listings. */
  name: string;
  /** Physical dealership address shown in contact and detail views. */
  address: string;
  /** Main phone number for dealership inquiries. */
  phone: string;
  /** Support email address for dealership inquiries. */
  email: string;
  /** WhatsApp contact number for dealership inquiries. */
  whatsappPhone: string;
  /** Public URL for the dealership logo. */
  logoUrl?: string | null;
  /** Supabase storage path for the dealership logo. */
  logoPath?: string | null;
  /** Cache-busting version for the dealership logo. */
  logoVersion?: string | null;
  /** MIME type for the dealership logo file. */
  logoMimeType?: string | null;
  /** Logo file size in bytes. */
  logoSizeBytes?: number | null;
  /** Last logo update timestamp. */
  logoUpdatedAt?: Date | string | null;
  /** Dealership opening hours. */
  workingHours?: WorkingHour[];
  /** Record creation timestamp. */
  createdAt: Date | string;
  /** Record last update timestamp. */
  updatedAt: Date | string;
}
