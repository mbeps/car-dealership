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
  BookingStatusEnum as BookingStatus,
  UserRoleEnum as UserRole,
  CarStatusEnum as CarStatus,
} from "@/types";

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

  const { data: user } = await supabase
    .from("User")
    .select("*")
    .eq("supabaseAuthUserId", authUser.id)
    .single();

  // If user not found in our db or not an admin, return not authorized
  if (!user || user.role !== UserRole.ADMIN) {
    return { authorized: false, reason: "not-admin" };
  }

  return { authorized: true, user };
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
      `
      )
      .order("bookingDate", { ascending: false })
      .order("startTime", { ascending: true });

    // Add status filter
    if (status) {
      query = query.eq("status", status);
    }

    const { data: bookings, error } = await query;

    if (error) throw error;

    // Format the bookings
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
      })
    );

    // Filter by search if provided (client-side filtering for now)
    let filtered = formattedBookings;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = formattedBookings.filter(
        (booking) =>
          booking.car.make.toLowerCase().includes(searchLower) ||
          booking.car.model.toLowerCase().includes(searchLower) ||
          booking.user.name?.toLowerCase().includes(searchLower) ||
          booking.user.email.toLowerCase().includes(searchLower)
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
  newStatus: BookingStatus
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
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    // Get user
    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (!user || user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Fetch all necessary data in parallel
    const [carsResult, testDrivesResult] = await Promise.all([
      supabase.from("Car").select("id, status, featured"),
      supabase.from("TestDriveBooking").select("id, status, carId"),
    ]);

    const cars = carsResult.data || [];
    const testDrives = testDrivesResult.data || [];

    // Calculate car statistics
    const totalCars = cars.length;
    const availableCars = cars.filter(
      (car) => car.status === CarStatus.AVAILABLE
    ).length;
    const soldCars = cars.filter((car) => car.status === CarStatus.SOLD).length;
    const unavailableCars = cars.filter(
      (car) => car.status === CarStatus.UNAVAILABLE
    ).length;
    const featuredCars = cars.filter((car) => car.featured === true).length;

    // Calculate test drive statistics
    const totalTestDrives = testDrives.length;
    const pendingTestDrives = testDrives.filter(
      (td) => td.status === BookingStatus.PENDING
    ).length;
    const confirmedTestDrives = testDrives.filter(
      (td) => td.status === BookingStatus.CONFIRMED
    ).length;
    const completedTestDrives = testDrives.filter(
      (td) => td.status === BookingStatus.COMPLETED
    ).length;
    const cancelledTestDrives = testDrives.filter(
      (td) => td.status === BookingStatus.CANCELLED
    ).length;
    const noShowTestDrives = testDrives.filter(
      (td) => td.status === BookingStatus.NO_SHOW
    ).length;

    // Calculate test drive conversion rate
    const completedTestDriveCarIds = testDrives
      .filter((td) => td.status === BookingStatus.COMPLETED)
      .map((td) => td.carId);

    const soldCarsAfterTestDrive = cars.filter(
      (car) =>
        car.status === CarStatus.SOLD &&
        completedTestDriveCarIds.includes(car.id)
    ).length;

    const conversionRate =
      completedTestDrives > 0
        ? (soldCarsAfterTestDrive / completedTestDrives) * 100
        : 0;

    return {
      success: true,
      data: {
        cars: {
          total: totalCars,
          available: availableCars,
          sold: soldCars,
          unavailable: unavailableCars,
          featured: featuredCars,
        },
        testDrives: {
          total: totalTestDrives,
          pending: pendingTestDrives,
          confirmed: confirmedTestDrives,
          completed: completedTestDrives,
          cancelled: cancelledTestDrives,
          noShow: noShowTestDrives,
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
