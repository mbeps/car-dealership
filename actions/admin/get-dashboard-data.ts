"use server";

import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";
import type { DashboardData } from "@/types/common/dashboard-data";
import { BookingStatusEnum as BookingStatus } from "@/enums/booking-status";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";

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

    const [carsResult, testDrivesResult] = await Promise.all([
      supabase.from("Car").select("id, status, featured"),
      supabase.from("TestDriveBooking").select("id, status, carId"),
    ]);

    const cars = carsResult.data || [];
    const testDrives = testDrivesResult.data || [];

    const totalCars = cars.length;
    const availableCars = cars.filter(
      (car) => car.status === CarStatus.AVAILABLE,
    ).length;
    const soldCars = cars.filter((car) => car.status === CarStatus.SOLD).length;
    const unavailableCars = cars.filter(
      (car) => car.status === CarStatus.UNAVAILABLE,
    ).length;
    const featuredCars = cars.filter((car) => car.featured === true).length;

    const totalTestDrives = testDrives.length;
    const pendingTestDrives = testDrives.filter(
      (td) => td.status === BookingStatus.PENDING,
    ).length;
    const confirmedTestDrives = testDrives.filter(
      (td) => td.status === BookingStatus.CONFIRMED,
    ).length;
    const completedTestDrives = testDrives.filter(
      (td) => td.status === BookingStatus.COMPLETED,
    ).length;
    const cancelledTestDrives = testDrives.filter(
      (td) => td.status === BookingStatus.CANCELLED,
    ).length;
    const noShowTestDrives = testDrives.filter(
      (td) => td.status === BookingStatus.NO_SHOW,
    ).length;

    const completedTestDriveCarIds = testDrives
      .filter((td) => td.status === BookingStatus.COMPLETED)
      .map((td) => td.carId);

    const soldCarsAfterTestDrive = cars.filter(
      (car) =>
        car.status === CarStatus.SOLD &&
        completedTestDriveCarIds.includes(car.id),
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
