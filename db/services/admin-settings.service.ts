/**
 * Admin service for dealership settings and working hours.
 */

import {
  getDealershipInfoRepository,
  getWorkingHourRepository,
  getUserRepository,
} from "@/db/repositories";
import { DealershipInfo, WorkingHour, User } from "@/db/entities";
import { DealershipInfoWithHours } from "@/db/types";
import { DayOfWeekEnum, UserRoleEnum, WorkingHourInput } from "@/types";
import { validateId, validateUserRole, uuidSchema } from "@/db/validation";
import { getDataSource } from "@/db/data-source";
import { EntityManager } from "typeorm";

export class AdminSettingsService {
  /**
   * Gets dealership info with working hours.
   */
  static async getDealershipInfo(): Promise<DealershipInfoWithHours | null> {
    const dealershipRepo = await getDealershipInfoRepository();

    // Assuming there's only one dealership info record
    const dealership = await dealershipRepo.findOne({
      order: { createdAt: "ASC" },
    });

    return await this.addWorkingHours(dealership);
  }

  /**
   * Updates dealership information.
   */
  static async updateDealershipInfo(
    id: string,
    updates: Partial<DealershipInfo>
  ): Promise<DealershipInfoWithHours | null> {
    const validatedId = validateId(id);
    const dealershipRepo = await getDealershipInfoRepository();
    await dealershipRepo.update(validatedId, updates);

    const updatedDealership = await dealershipRepo.findOne({
      where: { id },
    });

    return await this.addWorkingHours(updatedDealership);
  }

  private static async addWorkingHours(
    dealership: DealershipInfo | null
  ): Promise<DealershipInfoWithHours | null> {
    if (!dealership) {
      return null;
    }

    const workingHourRepo = await getWorkingHourRepository();
    const workingHours = await workingHourRepo.find({
      where: { dealershipId: dealership.id },
      order: { dayOfWeek: "ASC" },
    });

    return { ...dealership, workingHours };
  }

  /**
   * Gets all working hours.
   */
  static async getWorkingHours(): Promise<WorkingHour[]> {
    const workingHourRepo = await getWorkingHourRepository();
    return await workingHourRepo.find({
      order: { dayOfWeek: "ASC" },
    });
  }

  /**
   * Replaces all working hours for a dealership.
   */
  static async saveWorkingHours(
    dealershipId: string,
    workingHours: WorkingHourInput[]
  ): Promise<void> {
    const validatedId = validateId(dealershipId);
    const dataSource = await getDataSource();

    await dataSource.transaction(
      async (transactionalEntityManager: EntityManager) => {
        const workingHourRepo =
          transactionalEntityManager.getRepository(WorkingHour);

        // Delete existing
        await workingHourRepo.delete({ dealershipId: validatedId });

        // Insert new
        if (workingHours.length > 0) {
          const newHours = workingHours.map((wh) =>
            workingHourRepo.create({
              ...wh,
              dealershipId: validatedId,
            })
          );
          await workingHourRepo.save(newHours);
        }
      }
    );
  }

  /**
   * Updates working hours for a specific day.
   */
  static async updateWorkingHour(
    id: string,
    updates: Partial<WorkingHour>
  ): Promise<WorkingHour | null> {
    const validatedId = validateId(id);
    const workingHourRepo = await getWorkingHourRepository();
    await workingHourRepo.update(validatedId, updates);

    return await workingHourRepo.findOne({ where: { id } });
  }

  /**
   * Gets all admin users.
   */
  static async getAdminUsers(): Promise<User[]> {
    const userRepo = await getUserRepository();

    return await userRepo.find({
      where: { role: UserRoleEnum.ADMIN },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Gets all users (for admin management).
   */
  static async getAllUsers(): Promise<User[]> {
    const userRepo = await getUserRepository();
    return await userRepo.find({
      order: { createdAt: "DESC" },
    });
  }

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
   * Gets a user by ID.
   */
  static async getUserById(id: string): Promise<User | null> {
    const validatedId = validateId(id);
    const userRepo = await getUserRepository();
    return await userRepo.findOne({ where: { id: validatedId } });
  }

  /**
   * Updates a user's role.
   */
  static async updateUserRole(
    id: string,
    role: UserRoleEnum
  ): Promise<boolean> {
    const validatedId = validateId(id);
    const validatedRole = validateUserRole(role);
    const userRepo = await getUserRepository();
    const result = await userRepo.update(validatedId, { role: validatedRole });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Deletes a user.
   */
  static async deleteUser(id: string): Promise<boolean> {
    const validatedId = validateId(id);
    const userRepo = await getUserRepository();
    const result = await userRepo.delete(validatedId);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Creates or updates a user profile.
   */
  static async upsertUser(userData: Partial<User>): Promise<User> {
    const userRepo = await getUserRepository();

    // Validate auth ID if provided
    if (userData.supabaseAuthUserId) {
      userData.supabaseAuthUserId = uuidSchema.parse(
        userData.supabaseAuthUserId
      );
    }

    // Check if user exists by auth ID
    if (userData.supabaseAuthUserId) {
      const existing = await this.getUserByAuthId(userData.supabaseAuthUserId);
      if (existing) {
        await userRepo.update(existing.id, userData);
        return (await this.getUserById(existing.id))!;
      }
    }

    // Create new user
    const user = userRepo.create(userData);
    return await userRepo.save(user);
  }
}
