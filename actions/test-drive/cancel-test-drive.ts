"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/supabase";
import { ROUTES } from "@/constants/routes";
import type { ActionResponse } from "@/types/common/action-response";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { BookingStatusEnum as BookingStatus } from "@/enums/booking-status";

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
      return {
        success: false,
        error: "Booking not found",
      };
    }

    // Check if user owns this booking
    if (booking.userId !== user.id && user.role !== UserRole.ADMIN) {
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

    // Revalidate paths
    revalidatePath(ROUTES.RESERVATIONS);
    revalidatePath(ROUTES.ADMIN.ADMIN_TEST_DRIVES);

    return {
      success: true,
      data: "Test drive cancelled successfully",
    };
  } catch (error) {
    console.error("Error cancelling test drive:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
