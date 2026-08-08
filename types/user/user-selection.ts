import { User } from "./user";

/**
 * User data selection for display
 */
export type UserSelection = Pick<
  User,
  /** User identifier. */
  | "id"
  /** Display name. */
  | "name"
  /** Account email address. */
  | "email"
  /** Profile image URL. */
  | "imageUrl"
  /** Contact phone number. */
  | "phone"
>;
