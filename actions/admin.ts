"use server";

import { serializeCarData } from "@/lib/helpers";
import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import {
  AdminAuthResult,
  ActionResponse,
  TestDriveBookingWithUser,
  DashboardData,
} from "@/types";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export async function getAdmin(): Promise<AdminAuthResult> {
  const supabase = await createClient();
  
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) throw new Error("Unauthorized");

  const { data: user } = await supabase
    .from("User")
    .select("*")
    .eq("supabaseAuthUserId", authUser.id)
    .single();

  // If user not found in our db or not an admin, return not authorized
  if (!user || user.role !== "ADMIN") {
    return { authorized: false, reason: "not-admin" };
  }

  return { authorized: true, user };
}

/**
 * Get all test drives for admin with filters
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
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    // Verify admin status
    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (!user || user.role !== "ADMIN") {
      throw new Error("Unauthorized access");
    }

    // Build query
    let query = supabase
      .from("TestDriveBooking")
      .select(`
        *,
        car:Car(
          *,
          carMake:CarMake(id, name, slug),
          carColor:CarColor(id, name, slug)
        ),
        user:User(id, name, email, imageUrl, phone)
      `)
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
      filtered = formattedBookings.filter(booking => 
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
 * Update test drive status
 */
export async function updateTestDriveStatus(
  bookingId: string,
  newStatus: BookingStatus
): Promise<ActionResponse<string>> {
  try {
    const supabase = await createClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    // Verify admin status
    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (!user || user.role !== "ADMIN") {
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
      "PENDING",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
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
    revalidatePath("/admin/test-drives");
    revalidatePath("/reservations");

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

export async function getDashboardData(): Promise<
  ActionResponse<DashboardData>
> {
  try {
    const supabase = await createClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    // Get user
    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Fetch all necessary data in parallel
    const [carsResult, testDrivesResult] = await Promise.all([
      supabase
        .from("Car")
        .select("id, status, featured"),
      supabase
        .from("TestDriveBooking")
        .select("id, status, carId"),
    ]);

    const cars = carsResult.data || [];
    const testDrives = testDrivesResult.data || [];

    // Calculate car statistics
    const totalCars = cars.length;
    const availableCars = cars.filter((car) => car.status === "AVAILABLE").length;
    const soldCars = cars.filter((car) => car.status === "SOLD").length;
    const unavailableCars = cars.filter((car) => car.status === "UNAVAILABLE").length;
    const featuredCars = cars.filter((car) => car.featured === true).length;

    // Calculate test drive statistics
    const totalTestDrives = testDrives.length;
    const pendingTestDrives = testDrives.filter((td) => td.status === "PENDING").length;
    const confirmedTestDrives = testDrives.filter((td) => td.status === "CONFIRMED").length;
    const completedTestDrives = testDrives.filter((td) => td.status === "COMPLETED").length;
    const cancelledTestDrives = testDrives.filter((td) => td.status === "CANCELLED").length;
    const noShowTestDrives = testDrives.filter((td) => td.status === "NO_SHOW").length;

    // Calculate test drive conversion rate
    const completedTestDriveCarIds = testDrives
      .filter((td) => td.status === "COMPLETED")
      .map((td) => td.carId);

    const soldCarsAfterTestDrive = cars.filter(
      (car) => car.status === "SOLD" && completedTestDriveCarIds.includes(car.id)
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
