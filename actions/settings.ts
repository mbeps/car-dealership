"use server";

import { revalidatePath } from "next/cache";
import {
  ActionResponse,
  DealershipInfo,
  WorkingHourInput,
  User,
  UserRoleEnum,
} from "@/types";
import { dealershipInfoSchema } from "@/lib/schemas";
import { ROUTES } from "@/lib/routes";
import { AdminSettingsService } from "@/db/services/admin-settings.service";
import { getAdmin } from "./admin";

/**
 * Fetches dealership contact info and working hours.
 * Returns singleton record with nested hours.
 * Used for test drive forms and contact CTAs.
 *
 * @returns Dealership info with working hours or null
 * @see DealershipInfo - Singleton table
 * @see WorkingHour - Related hours table
 */
export async function getDealershipInfo(): Promise<
  ActionResponse<DealershipInfo | null>
> {
  try {
    const dealership = await AdminSettingsService.getDealershipInfo();

    if (!dealership) {
      return {
        success: true,
        data: null,
      };
    }

    // Serialize dates
    const serialized: DealershipInfo = {
      ...dealership,
      createdAt: dealership.createdAt.toISOString(),
      updatedAt: dealership.updatedAt.toISOString(),
      workingHours: dealership.workingHours?.map((wh) => ({
        ...wh,
        createdAt: wh.createdAt.toISOString(),
        updatedAt: wh.updatedAt.toISOString(),
      })),
    };

    return {
      success: true,
      data: serialized,
    };
  } catch (error) {
    console.error("Error fetching dealership info:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Replaces all working hours for dealership.
 * Deletes existing hours then inserts new set.
 * Revalidates admin settings and test drive pages.
 *
 * @param dealershipId - Target dealership
 * @param workingHours - New hours to save
 * @returns Success message or error
 * @see WorkingHour - Hours table
 */
export async function saveWorkingHours(
  dealershipId: string,
  workingHours: WorkingHourInput[]
): Promise<ActionResponse<string>> {
  try {
    const auth = await getAdmin();
    if (!auth.authorized) {
      throw new Error("Unauthorized access");
    }

    await AdminSettingsService.saveWorkingHours(dealershipId, workingHours);

    revalidatePath(ROUTES.ADMIN_SETTINGS);
    // Revalidate test-drive pages as working hours affect availability
    revalidatePath("/test-drive");

    return {
      success: true,
      data: "Working hours updated successfully",
    };
  } catch (error) {
    console.error("Error saving working hours:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Fetches all users for admin user management.
 * Requires admin role.
 * Sorted by newest first.
 *
 * @returns All user records
 * @see User - Database user table
 */
export async function getUsers(): Promise<ActionResponse<User[]>> {
  try {
    const auth = await getAdmin();
    if (!auth.authorized) {
      throw new Error("Unauthorized access");
    }

    // Fetch all users
    const users = await AdminSettingsService.getAllUsers();

    // Serialize dates
    const serializedUsers: User[] = users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    return {
      success: true,
      data: serializedUsers,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Updates user role from admin settings.
 * Prevents self-role changes.
 * Revalidates admin settings page.
 *
 * @param userId - User to update
 * @param newRole - ADMIN or USER
 * @returns Success message or error
 */
export async function updateUserRole(
  userId: string,
  newRole: "ADMIN" | "USER"
): Promise<ActionResponse<string>> {
  try {
    const auth = await getAdmin();
    if (!auth.authorized) {
      throw new Error("Unauthorized access");
    }

    // Don't allow updating own role
    if (auth.user.id === userId) {
      return {
        success: false,
        error: "You cannot change your own role",
      };
    }

    // Update user role
    await AdminSettingsService.updateUserRole(userId, newRole as UserRoleEnum);

    revalidatePath(ROUTES.ADMIN_SETTINGS);

    return {
      success: true,
      data: "User role updated successfully",
    };
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Updates dealership contact information.
 * Validates input with zod schema.
 * Revalidates settings and test drive pages.
 *
 * @param dealershipId - Dealership to update
 * @param data - New contact info
 * @returns Success message or error
 * @see dealershipInfoSchema - Validation schema
 */
export async function updateDealershipInfo(
  dealershipId: string,
  data: {
    name: string;
    address: string;
    email: string;
    phone: string;
    whatsappPhone: string;
  }
): Promise<ActionResponse<string>> {
  try {
    const auth = await getAdmin();
    if (!auth.authorized) {
      throw new Error("Unauthorized access");
    }

    // Validate input data
    const validatedData = dealershipInfoSchema.parse(data);

    // Update dealership info
    await AdminSettingsService.updateDealershipInfo(
      dealershipId,
      validatedData
    );

    revalidatePath(ROUTES.ADMIN_SETTINGS);
    // Revalidate test-drive pages as dealership info is shown there
    revalidatePath("/test-drive");

    return {
      success: true,
      data: "Dealership information updated successfully",
    };
  } catch (error) {
    console.error("Error updating dealership info:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
