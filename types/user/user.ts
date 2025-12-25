import { UserRole } from "@/enums/user-role";

/**
 * User type (extended from Supabase auth)
 */
export interface User {
  id: string;
  supabaseAuthUserId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  phone: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  role: UserRole;
}
