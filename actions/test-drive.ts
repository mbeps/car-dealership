"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/supabase";
import { ROUTES } from "@/constants/routes";
import { serializeCarData } from "@/lib/helpers/serialize-car";
import type { ActionResponse } from "@/types/common/action-response";
import type { TestDriveFormData } from "@/types/test-drive/test-drive-form-data";
import type { TestDriveBookingWithCar } from "@/types/test-drive/test-drive-booking-with-car";
import type { TestDriveBooking } from "@/types/test-drive/test-drive-booking";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";
import { BookingStatusEnum as BookingStatus } from "@/enums/booking-status";

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
): Promise<ActionResponse<TestDriveBooking>> {
  try {
    const { carId, bookingDate, startTime, endTime, notes } = formData;

    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser)
      throw new Error("You must be logged in to book a test drive");

    // Find user in our database
    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (!user) throw new Error("User not found in database");

    // Prevent admins from making bookings through the regular form
    if (user.role === UserRole.ADMIN) {
      throw new Error(
        "Admins cannot book test drives. Please use the admin panel to manage bookings."
      );
    }

    // Check if car exists and is available
    const { data: car } = await supabase
      .from("Car")
      .select("*")
      .eq("id", carId)
      .eq("status", CarStatus.AVAILABLE)
      .single();

    if (!car) throw new Error("Car not available for test drive");

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

    // Revalidate relevant paths
    revalidatePath(ROUTES.TEST_DRIVE(carId));
    revalidatePath(ROUTES.CAR_DETAILS(carId));

    return {
      success: true,
      data: booking,
    };
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
      `
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
      })
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
    revalidatePath(ROUTES.ADMIN_TEST_DRIVES);

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
