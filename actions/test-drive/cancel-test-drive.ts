"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import { BookingStatusEnum as BookingStatus } from "@/enums/booking-status";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { getLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";

const log = getLogger(["app", "actions", "test-drive"]);

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
  bookingId: string,
): Promise<ActionResponse<string>> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) {
      log.warn(
        "Unauthorized attempt to cancel test drive (bookingId: {bookingId})",
        { bookingId },
      );
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get the user from our database
    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (!user) {
      log.warn(
        "User profile not found when cancelling booking (bookingId: {bookingId})",
        {
          bookingId,
        },
      );
      return {
        success: false,
        error: "User not found",
      };
    }

    // Get the booking
    const { data: booking } = await supabase
      .from("TestDriveBooking")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      log.warn("Booking not found to cancel (bookingId: {bookingId})", {
        bookingId,
      });
      return {
        success: false,
        error: "Booking not found",
      };
    }

    // Check if user owns this booking
    if (booking.userId !== user.id && user.role !== UserRole.ADMIN) {
      log.warn(
        "Unauthorized user attempted to cancel booking (bookingId: {bookingId}, userId: {userId})",
        { bookingId, userId: user.id },
      );
      return {
        success: false,
        error: "Unauthorized to cancel this booking",
      };
    }

    // Check if booking can be cancelled
    if (booking.status === BookingStatus.CANCELLED) {
      return {
        success: false,
        error: "Booking is already cancelled",
      };
    }

    if (booking.status === BookingStatus.COMPLETED) {
      return {
        success: false,
        error: "Cannot cancel a completed booking",
      };
    }

    // Update the booking status
    const { error: updateError } = await supabase
      .from("TestDriveBooking")
      .update({ status: BookingStatus.CANCELLED })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    log.info("Test drive cancelled successfully (bookingId: {bookingId})", {
      bookingId,
    });

    // Revalidate paths
    revalidatePath(ROUTES.RESERVATIONS);
    revalidatePath(ROUTES.ADMIN.ADMIN_TEST_DRIVES);

    return {
      success: true,
      data: "Test drive cancelled successfully",
    };
  } catch (error) {
    log.error("Error cancelling test drive (bookingId: {bookingId}): {error}", {
      bookingId,
      error: (error as Error).message,
    });
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
