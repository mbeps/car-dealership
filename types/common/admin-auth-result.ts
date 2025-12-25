import { User } from "../user/user";

/**
 * Admin authorization result
 */
export type AdminAuthResult =
  | { authorized: true; user: User }
  | { authorized: false; reason?: string };
