"use server";

import { createClient } from "@/lib/supabase/supabase";
import { serializeCarData } from "@/lib/helpers/serialize-car";
import type { ActionResponse } from "@/types/common/action-response";
import type { TestDriveBookingWithUser } from "@/types/test-drive/test-drive-booking-with-user";
import { UserRoleEnum as UserRole } from "@/enums/user-role";

/**
 * Retrieves filtered test drive bookings for admin dashboard.
 * Includes user and car details via joins.
 * Client-side search filters by car make/model or user name/email.
 *
 * @param search - Search term for make, model, user name, or email
 * @param status - Filter by booking status (PENDING, CONFIRMED, etc.)
 * @returns List of bookings with nested car and user data
 * @see TestDriveBooking - Database table for bookings
 */
export async function getAdminTestDrives({
  search = "",
  status = "",
}: {
  search?: string;
  status?: string;
}): Promise<ActionResponse<TestDriveBookingWithUser[]>> {
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

    // Build query
    let query = supabase
      .from("TestDriveBooking")
      .select(
        `
        *,
        car:Car(
          *,
          carMake:CarMake(id, name, slug),
          carColor:CarColor(id, name, slug)
        ),
        user:User(id, name, email, imageUrl, phone)
      `,
      )
      .order("bookingDate", { ascending: false })
      .order("startTime", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: bookings, error } = await query;

    if (error) throw error;

    const formattedBookings: TestDriveBookingWithUser[] = (bookings || []).map(
      (booking) => ({
        id: booking.id,
        carId: booking.carId,
        car: serializeCarData(booking.car),
        userId: booking.userId,
        user: booking.user,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        notes: booking.notes,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      }),
    );

    let filtered = formattedBookings;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = formattedBookings.filter(
        (booking) =>
          booking.car.make.toLowerCase().includes(searchLower) ||
          booking.car.model.toLowerCase().includes(searchLower) ||
          booking.user.name?.toLowerCase().includes(searchLower) ||
          booking.user.email.toLowerCase().includes(searchLower),
      );
    }

    return {
      success: true,
      data: filtered,
    };
  } catch (error) {
    console.error("Error fetching test drives:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
