import type { User } from "../user/user";

/**
 * Admin authorization result.
 * Used by admin route guards to return either the signed-in user or an authorization failure reason.
 */
export type AdminAuthResult =
  | { authorized: true; user: User }
  | { authorized: false; reason?: string };
