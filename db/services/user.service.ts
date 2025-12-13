import { getUserRepository } from "@/db/repositories";
import { User } from "@/db/entities";
import { uuidSchema } from "@/db/validation";
import { UserRoleEnum } from "@/types";
import { EntityManager } from "typeorm";

export class UserService {
  /**
   * Gets a user by their Supabase auth ID.
   */
  static async getUserByAuthId(authId: string): Promise<User | null> {
    const validatedAuthId = uuidSchema.parse(authId);
    const userRepo = await getUserRepository();
    return await userRepo.findOne({
      where: { supabaseAuthUserId: validatedAuthId },
    });
  }

  /**
   * Ensures a user profile exists for the given auth ID.
   * Creates one if it doesn't exist.
   */
  static async ensureProfile(
    authId: string,
    email: string,
    metadata: any
  ): Promise<User | null> {
    const validatedAuthId = uuidSchema.parse(authId);
    const userRepo = await getUserRepository();

    try {
      // Check if profile exists
      const existingUser = await userRepo.findOne({
        where: { supabaseAuthUserId: validatedAuthId },
      });

      if (existingUser) {
        return existingUser;
      }

      // Create new profile
      const name =
        metadata?.full_name || metadata?.name || email?.split("@")[0] || "User";

      const newUser = userRepo.create({
        supabaseAuthUserId: validatedAuthId,
        email: email,
        name: name,
        imageUrl: metadata?.avatar_url || metadata?.picture,
        phone: metadata?.phone,
        role: UserRoleEnum.USER, // Default role
      });

      return await userRepo.save(newUser);
    } catch (error: any) {
      // Handle unique constraint violation (race condition)
      if (error.code === "23505") {
        return await userRepo.findOne({
          where: { supabaseAuthUserId: validatedAuthId },
        });
      }
      console.error("Error ensuring profile:", error);
      return null;
    }
  }

  /**
   * Ensures a user profile exists using a specific EntityManager.
   * Useful for transactions.
   */
  static async ensureProfileWithManager(
    manager: EntityManager,
    authId: string,
    email: string,
    metadata: any
  ): Promise<User | null> {
    const validatedAuthId = uuidSchema.parse(authId);
    const userRepo = manager.getRepository(User);

    try {
      // Check if profile exists
      const existingUser = await userRepo.findOne({
        where: { supabaseAuthUserId: validatedAuthId },
      });

      if (existingUser) {
        return existingUser;
      }

      // Create new profile
      const name =
        metadata?.full_name || metadata?.name || email?.split("@")[0] || "User";

      const newUser = userRepo.create({
        supabaseAuthUserId: validatedAuthId,
        email: email,
        name: name,
        imageUrl: metadata?.avatar_url || metadata?.picture,
        phone: metadata?.phone,
        role: UserRoleEnum.USER, // Default role
      });

      return await userRepo.save(newUser);
    } catch (error: any) {
      // Handle unique constraint violation (race condition)
      if (error.code === "23505") {
        return await userRepo.findOne({
          where: { supabaseAuthUserId: validatedAuthId },
        });
      }
      console.error("Error ensuring profile:", error);
      return null;
    }
  }
}
