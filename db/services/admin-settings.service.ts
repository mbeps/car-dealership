/**
 * Admin service for dealership settings and working hours.
 */

import {
  getDealershipInfoRepository,
  getWorkingHourRepository,
  getUserRepository,
} from "@/db/repositories";
import { DealershipInfo, WorkingHour, User } from "@/db/entities";
import { DayOfWeekEnum, UserRoleEnum } from "@/types";

export class AdminSettingsService {
  /**
   * Gets dealership info with working hours.
   */
  static async getDealershipInfo(): Promise<DealershipInfo | null> {
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
  ): Promise<DealershipInfo | null> {
    const dealershipRepo = await getDealershipInfoRepository();
    await dealershipRepo.update(id, updates);

    const updatedDealership = await dealershipRepo.findOne({
      where: { id },
    });

    return await this.addWorkingHours(updatedDealership);
  }

  private static async addWorkingHours(
    dealership: DealershipInfo | null
  ): Promise<DealershipInfo | null> {
    if (!dealership) {
      return null;
    }

    const workingHourRepo = await getWorkingHourRepository();
    const workingHours = await workingHourRepo.find({
      where: { dealershipId: dealership.id },
      order: { dayOfWeek: "ASC" },
    });

    return Object.assign(dealership, { workingHours });
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
   * Updates working hours for a specific day.
   */
  static async updateWorkingHour(
    id: string,
    updates: Partial<WorkingHour>
  ): Promise<WorkingHour | null> {
    const workingHourRepo = await getWorkingHourRepository();
    await workingHourRepo.update(id, updates);

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
   * Gets a user by their Supabase auth ID.
   */
  static async getUserByAuthId(authId: string): Promise<User | null> {
    const userRepo = await getUserRepository();
    return await userRepo.findOne({
      where: { supabaseAuthUserId: authId },
    });
  }

  /**
   * Gets a user by ID.
   */
  static async getUserById(id: string): Promise<User | null> {
    const userRepo = await getUserRepository();
    return await userRepo.findOne({ where: { id } });
  }

  /**
   * Updates a user's role.
   */
  static async updateUserRole(
    id: string,
    role: UserRoleEnum
  ): Promise<boolean> {
    const userRepo = await getUserRepository();
    const result = await userRepo.update(id, { role });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Deletes a user.
   */
  static async deleteUser(id: string): Promise<boolean> {
    const userRepo = await getUserRepository();
    const result = await userRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Creates or updates a user profile.
   */
  static async upsertUser(userData: Partial<User>): Promise<User> {
    const userRepo = await getUserRepository();

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
