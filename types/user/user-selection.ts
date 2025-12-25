import { User } from "./user";

/**
 * User data selection for display
 */
export type UserSelection = Pick<
  User,
  "id" | "name" | "email" | "imageUrl" | "phone"
>;
