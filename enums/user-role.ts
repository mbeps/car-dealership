/**
 * User roles in the system
 */
export enum UserRoleEnum {
  /** Account administrator with elevated permissions. */
  ADMIN = "ADMIN",
  /** Standard account user. */
  USER = "USER",
}

export type UserRole = UserRoleEnum;
