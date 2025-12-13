/**
 * Centralized authentication and authorization utilities.
 * Reduces code duplication and ensures consistent auth checks.
 */

import { createClient } from "@/lib/supabase";
import { AdminSettingsService } from "@/db/services";

export interface AuthResult {
  supabaseAuthUserId: string;
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
}

/**
 * Gets the current authenticated user from Supabase.
 * Throws if not authenticated.
 *
 * @returns Supabase auth user
 * @throws Error if not authenticated
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized: Not authenticated");
  }

  return user;
}

/**
 * Gets current user with role information.
 * Uses TypeORM service to fetch user from database.
 *
 * @returns User data with role
 * @throws Error if not authenticated or user not found
 */
export async function getCurrentUser(): Promise<AuthResult> {
  const authUser = await getAuthUser();

  // Use TypeORM service to get user data
  const user = await AdminSettingsService.getUserByAuthId(authUser.id);

  if (!user) {
    throw new Error("Unauthorized: User profile not found");
  }

  return {
    supabaseAuthUserId: authUser.id,
    userId: user.id,
    email: user.email,
    role: user.role,
  };
}

/**
 * Ensures current user is an admin.
 * Use this as the first line in admin-only server actions.
 *
 * @returns Admin user data
 * @throws Error if not authenticated or not an admin
 *
 * @example
 * export async function adminAction() {
 *   const admin = await requireAdmin();
 *   // ... admin logic
 * }
 */
export async function requireAdmin(): Promise<AuthResult> {
  const user = await getCurrentUser();

  if (user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}

/**
 * Ensures current user is authenticated (any role).
 * Use this for user-facing operations that require login.
 *
 * @returns User data
 * @throws Error if not authenticated
 *
 * @example
 * export async function userAction() {
 *   const user = await requireAuth();
 *   // ... user logic
 * }
 */
export async function requireAuth(): Promise<AuthResult> {
  return await getCurrentUser();
}

/**
 * Checks if current user is authenticated without throwing.
 * Useful for optional auth scenarios.
 *
 * @returns User data or null if not authenticated
 */
export async function getOptionalUser(): Promise<AuthResult | null> {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}

/**
 * Checks if current user is an admin without throwing.
 *
 * @returns True if admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user.role === "ADMIN";
  } catch {
    return false;
  }
}
