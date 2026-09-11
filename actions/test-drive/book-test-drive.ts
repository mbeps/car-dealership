"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import { BookingStatusEnum as BookingStatus } from "@/enums/booking-status";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { getLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";
import type { TestDriveBooking } from "@/types/test-drive/test-drive-booking";
import type { TestDriveFormData } from "@/types/test-drive/test-drive-form-data";

const log = getLogger(["app", "actions", "test-drive"]);

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
  formData: TestDriveFormData,
): Promise<ActionResponse<TestDriveBooking>> {
  try {
    const { carId, bookingDate, startTime, endTime, notes } = formData;

    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) {
      log.warn("Unauthorized attempt to book test drive (carId: {carId})", {
        carId,
      });
      throw new Error("You must be logged in to book a test drive");
    }

    // Find user in our database
    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (!user) {
      log.warn(
        "User profile not found when booking test drive (carId: {carId})",
        {
          carId,
        },
      );
      throw new Error("User not found in database");
    }

    // Prevent admins from making bookings through the regular form
    if (user.role === UserRole.ADMIN) {
      log.warn(
        "Admin attempted to book test drive via public form (userId: {userId})",
        {
          userId: user.id,
        },
      );
      throw new Error(
        "Admins cannot book test drives. Please use the admin panel to manage bookings.",
      );
    }

    // Check if car exists and is available
    const { data: car } = await supabase
      .from("Car")
      .select("*")
      .eq("id", carId)
      .eq("status", CarStatus.AVAILABLE)
      .single();

    if (!car) {
      log.warn("Attempted to book unavailable car (carId: {carId})", { carId });
      throw new Error("Car not available for test drive");
    }

    // Check if slot is already booked
    const { data: existingBooking } = await supabase
      .from("TestDriveBooking")
      .select("*")
      .eq("carId", carId)
      .eq("bookingDate", bookingDate)
      .eq("startTime", startTime)
      .in("status", [BookingStatus.PENDING, BookingStatus.CONFIRMED])
      .single();

    if (existingBooking) {
      log.warn(
        "Test drive slot already booked (carId: {carId}, slot: {slot})",
        {
          carId,
          slot: `${bookingDate} ${startTime}`,
        },
      );
      return {
        success: false,
        error: "This time slot is already booked. Please select another time.",
      };
    }

    // Create the booking
    const { data: booking, error: insertError } = await supabase
      .from("TestDriveBooking")
      .insert({
        carId,
        userId: user.id,
        bookingDate,
        startTime,
        endTime,
        notes: notes || null,
        status: BookingStatus.PENDING,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    log.info(
      "Test drive booked successfully (bookingId: {bookingId}, carId: {carId})",
      { bookingId: booking.id, carId },
    );

    // Revalidate relevant paths
    revalidatePath(ROUTES.TEST_DRIVE(carId));
    revalidatePath(ROUTES.HOME.CAR_DETAILS(carId));

    return {
      success: true,
      data: booking,
    };
  } catch (error) {
    log.error("Error booking test drive: {error}", {
      error: (error as Error).message,
    });
    return {
      success: false,
      error: (error as Error).message || "Failed to book test drive",
    };
  }
}
