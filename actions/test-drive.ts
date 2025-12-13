"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";
import { ROUTES } from "@/lib/routes";
import {
  ActionResponse,
  TestDriveFormData,
  TestDriveBookingWithCar,
} from "@/types";
import { withRLS } from "@/db/rls-manager";
import { UserTestDriveService } from "@/db/services/user-test-drive.service";
import { UserService } from "@/db/services/user.service";

/**
 * Creates test drive booking from user form.
 * Blocks admin users from booking via public form.
 * Validates car availability and slot uniqueness.
 * Sets initial status to PENDING.
 * Revalidates test drive and detail pages.
 *
 * @param formData - Validated booking details
 * @returns Created booking or error
 * @see TestDriveFormData - Zod-validated input
 * @see TestDriveBooking - Database table
 */
export async function bookTestDrive(
  formData: TestDriveFormData
): Promise<ActionResponse<any>> {
  try {
    const { carId } = formData;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      throw new Error("You must be logged in to book a test drive");

    return await withRLS(user.id, async (manager) => {
      // Ensure user exists
      await UserService.ensureProfileWithManager(
        manager,
        user.id,
        user.email!,
        user.user_metadata
      );

      const service = new UserTestDriveService(manager);
      const booking = await service.bookTestDrive(formData, user.id);

      revalidatePath(ROUTES.TEST_DRIVE(carId));
      revalidatePath(ROUTES.CAR_DETAILS(carId));

      return {
        success: true,
        data: booking,
      };
    });
  } catch (error) {
    console.error("Error booking test drive:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to book test drive",
    };
  }
}

/**
 * Retrieves user's test drive bookings for reservations page.
 * Includes full car details with make/color joins.
 * Sorted by booking date descending.
 *
 * @returns User's bookings with nested car data
 * @see ROUTES.RESERVATIONS - Reservations page
 * @see TestDriveBookingWithCar - Type with nested car
 */
export async function getUserTestDrives(): Promise<
  ActionResponse<TestDriveBookingWithCar[]>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    return await withRLS(user.id, async (manager) => {
      await UserService.ensureProfileWithManager(
        manager,
        user.id,
        user.email!,
        user.user_metadata
      );

      const service = new UserTestDriveService(manager);
      const bookings = await service.getUserTestDrives(user.id);

      return {
        success: true,
        data: bookings,
      };
    });
  } catch (error) {
    console.error("Error fetching test drives:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Cancels test drive booking.
 * Validates ownership (user owns booking or is admin).
 * Prevents cancelling already cancelled or completed bookings.
 * Revalidates reservations and admin pages.
 *
 * @param bookingId - Booking to cancel
 * @returns Success message or error
 * @see TestDriveBooking.status - Status enum
 */
export async function cancelTestDrive(
  bookingId: string
): Promise<ActionResponse<string>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    return await withRLS(user.id, async (manager) => {
      await UserService.ensureProfileWithManager(
        manager,
        user.id,
        user.email!,
        user.user_metadata
      );

      const service = new UserTestDriveService(manager);
      const message = await service.cancelTestDrive(bookingId, user.id);

      revalidatePath(ROUTES.RESERVATIONS);
      revalidatePath(ROUTES.ADMIN_TEST_DRIVES);

      return {
        success: true,
        data: message,
      };
    });
  } catch (error) {
    console.error("Error cancelling test drive:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
