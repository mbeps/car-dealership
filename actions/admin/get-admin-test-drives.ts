"use server";

import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { serializeCarData } from "@/lib/helpers/serialize-car";
import { getLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";
import type { TestDriveBookingWithUser } from "@/types/test-drive/test-drive-booking-with-user";

const log = getLogger(["app", "actions", "admin"]);

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
  log.debug("Fetching admin test drives (status: '{status}')", { status });
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) {
      log.warn("Unauthorized attempt to access admin test drives");
      throw new Error("Unauthorized");
    }

    // Verify admin status
    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (!user || user.role !== UserRole.ADMIN) {
      log.warn("Forbidden access attempt to admin test drives");
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
    log.error("Error fetching admin test drives: {error}", {
      error: (error as Error).message,
    });
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
