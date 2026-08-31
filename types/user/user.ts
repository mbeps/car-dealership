import type { UserRole } from "@/enums/user-role";

/**
 * User type (extended from Supabase auth)
 */
export interface User {
  /** Unique database identifier for the application user. */
  id: string;
  /** Supabase authentication user ID linked to this application user. */
  supabaseAuthUserId: string;
  /** Account email address used for sign-in and notifications. */
  email: string;
  /** Display name shown in the application. */
  name: string | null;
  /** Profile image URL, when available. */
  imageUrl: string | null;
  /** Contact phone number, when available. */
  phone: string | null;
  /** Timestamp when this application user was created. */
  createdAt: Date | string;
  /** Timestamp when this application user was last updated. */
  updatedAt: Date | string;
  /** Application role for access control. */
  role: UserRole;
}
