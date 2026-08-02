"use server";

import { createClient } from "@/lib/supabase/supabase";
import { serializeCarData } from "@/lib/helpers/serialize-car";
import type { ActionResponse } from "@/types/common/action-response";
import type { TestDriveBookingWithCar } from "@/types/test-drive/test-drive-booking-with-car";

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

    // Get user's test drive bookings
    const { data: bookings, error } = await supabase
      .from("TestDriveBooking")
      .select(
        `
        *,
        car:Car(
          *,
          carMake:CarMake(id, name, slug),
          carColor:CarColor(id, name, slug)
        )
      `,
      )
      .eq("userId", user.id)
      .order("bookingDate", { ascending: false });

    if (error) throw error;

    // Format the bookings
    const formattedBookings: TestDriveBookingWithCar[] = (bookings || []).map(
      (booking) => ({
        id: booking.id,
        carId: booking.carId,
        car: serializeCarData(booking.car),
        userId: booking.userId,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        notes: booking.notes,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      }),
    );

    return {
      success: true,
      data: formattedBookings,
    };
  } catch (error) {
    console.error("Error fetching test drives:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
