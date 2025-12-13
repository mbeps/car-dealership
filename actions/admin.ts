"use server";

import { serializeCarData } from "@/lib/helpers";
import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";
import {
  AdminAuthResult,
  ActionResponse,
  TestDriveBookingWithUser,
  DashboardData,
  BookingStatusEnum,
} from "@/types";
import { AdminCarService, AdminTestDriveService } from "@/db/services";
import { getUserRepository } from "@/db/repositories";

/**
 * Verifies admin access for protected routes.
 * Called by admin layout to enforce role-based access.
 *
 * @returns Authorization result with user data if admin, or reason if denied
 * @see ROUTES.ADMIN - Protected admin routes
 */
export async function getAdmin(): Promise<AdminAuthResult> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !authUser) throw new Error("Unauthorized");

  const userRepo = await getUserRepository();
  const user = await userRepo.findOne({
    where: { supabaseAuthUserId: authUser.id },
  });

  // If user not found in our db or not an admin, return not authorized
  if (!user || user.role !== "ADMIN") {
    return { authorized: false, reason: "not-admin" };
  }

  const serializedUser = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };

  return { authorized: true, user: serializedUser };
}

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
    const auth = await getAdmin();
    if (!auth.authorized) {
      throw new Error("Unauthorized access");
    }

    const bookings = await AdminTestDriveService.getBookings({
      search,
      status: status ? (status as BookingStatusEnum) : undefined,
    });

    // Format the bookings
    const formattedBookings: TestDriveBookingWithUser[] = bookings.map(
      (booking) => ({
        id: booking.id,
        carId: booking.carId,
        car: serializeCarData(booking.car!),
        userId: booking.userId,
        user: booking.user!,
        bookingDate:
          booking.bookingDate instanceof Date
            ? booking.bookingDate.toISOString().split("T")[0]
            : (booking.bookingDate as unknown as string),
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        notes: booking.notes,
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
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
 * Updates booking status from admin panel.
 * Revalidates admin and user reservation pages.
 *
 * @param bookingId - Target booking ID
 * @param newStatus - New status to apply
 * @returns Success message or error
 * @see ROUTES.ADMIN_TEST_DRIVES - Admin test drives page
 * @see ROUTES.RESERVATIONS - User reservations page
 */
export async function updateTestDriveStatus(
  bookingId: string,
  newStatus: BookingStatusEnum
): Promise<ActionResponse<string>> {
  try {
    const auth = await getAdmin();
    if (!auth.authorized) {
      throw new Error("Unauthorized access");
    }

    await AdminTestDriveService.updateBookingStatus(bookingId, newStatus);

    // Revalidate paths
    revalidatePath(ROUTES.ADMIN_TEST_DRIVES);
    revalidatePath(ROUTES.RESERVATIONS);

    return {
      success: true,
      data: "Test drive status updated successfully",
    };
  } catch (error) {
    throw new Error(
      "Error updating test drive status:" + (error as Error).message
    );
  }
}

/**
 * Calculates KPIs for admin dashboard.
 * Aggregates car inventory stats and test drive metrics.
 * Computes conversion rate from completed test drives to sales.
 *
 * @returns Dashboard data with car and test drive statistics
 * @see DashboardData - Type for dashboard metrics
 */
export async function getDashboardData(): Promise<
  ActionResponse<DashboardData>
> {
  try {
    const auth = await getAdmin();
    if (!auth.authorized) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const [carStats, testDriveStats, completedTestDriveCarIds] =
      await Promise.all([
        AdminCarService.getStatistics(),
        AdminTestDriveService.getStatistics(),
        AdminTestDriveService.getCompletedTestDriveCarIds(),
      ]);

    // Calculate conversion rate: sold cars that had completed test drives
    const soldCarsAfterTestDrive = await AdminCarService.countSoldCars(
      completedTestDriveCarIds
    );

    const conversionRate =
      testDriveStats.completed > 0
        ? (soldCarsAfterTestDrive / testDriveStats.completed) * 100
        : 0;

    return {
      success: true,
      data: {
        cars: carStats,
        testDrives: {
          ...testDriveStats,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
