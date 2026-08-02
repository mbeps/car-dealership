"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/supabase";
import { ROUTES } from "@/constants/routes";
import type { ActionResponse } from "@/types/common/action-response";
import { BookingStatusEnum as BookingStatus } from "@/enums/booking-status";
import { UserRoleEnum as UserRole } from "@/enums/user-role";

/**
 * Updates booking status from admin panel.
 * Revalidates admin and user reservation pages.
 *
 * @param bookingId - Target booking ID
 * @param newStatus - New status to apply
 * @returns Success message or error
 * @see ROUTES.ADMIN.ADMIN_TEST_DRIVES - Admin test drives page
 * @see ROUTES.RESERVATIONS - User reservations page
 */
export async function updateTestDriveStatus(
  bookingId: string,
  newStatus: BookingStatus,
): Promise<ActionResponse<string>> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    // Verify admin status
    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (!user || user.role !== UserRole.ADMIN) {
      throw new Error("Unauthorized access");
    }

    // Get the booking
    const { data: booking } = await supabase
      .from("TestDriveBooking")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Validate status
    const validStatuses: BookingStatus[] = [
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
      BookingStatus.NO_SHOW,
    ];
    if (!validStatuses.includes(newStatus)) {
      return {
        success: false,
        error: "Invalid status",
      };
    }

    // Update status
    const { error: updateError } = await supabase
      .from("TestDriveBooking")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    // Revalidate paths
    revalidatePath(ROUTES.ADMIN.ADMIN_TEST_DRIVES);
    revalidatePath(ROUTES.RESERVATIONS);

    return {
      success: true,
      data: "Test drive status updated successfully",
    };
  } catch (error) {
    throw new Error(
      "Error updating test drive status:" + (error as Error).message,
    );
  }
}
