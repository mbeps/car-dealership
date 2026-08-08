"use server";

import { createClient } from "@/lib/supabase/supabase";
import { serializeCarData } from "@/lib/helpers/serialize-car";
import type { ActionResponse } from "@/types/common/action-response";
import type { SerializedCar } from "@/types/car/serialized-car";
import type { UserTestDrive } from "@/types/test-drive/user-test-drive";
import type { SerializedDealershipInfo } from "@/types/dealership/serialized-dealership-info";
import { BookingStatusEnum as BookingStatus } from "@/enums/booking-status";

/**
 * Fetches car details with test drive metadata.
 * Includes dealership info, working hours, existing bookings, user's active booking.
 * Powers both detail page and test drive form.
 *
 * @param carId - Target car ID
 * @returns Car with nested test drive context
 * @see ROUTES.HOME.CAR_DETAILS - Detail page
 * @see ROUTES.TEST_DRIVE - Test drive booking page
 */
export async function getCarById(carId: string): Promise<
  ActionResponse<
    SerializedCar & {
      testDriveInfo: {
        userTestDrive: UserTestDrive | null;
        dealership: SerializedDealershipInfo | null;
        existingBookings: Array<{
          date: string;
          startTime: string;
          endTime: string;
        }>;
      };
    }
  >
> {
  try {
    const supabase = await createClient();

    // Get current user if authenticated
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    let dbUser = null;

    if (authUser) {
      const { data } = await supabase
        .from("User")
        .select("*")
        .eq("supabaseAuthUserId", authUser.id)
        .single();
      dbUser = data;
    }

    // Get car details
    const { data: car, error } = await supabase
      .from("Car")
      .select(
        `
        *,
        carMake:CarMake(id, name, slug),
        carColor:CarColor(id, name, slug)
      `,
      )
      .eq("id", carId)
      .single();

    if (error || !car) {
      return {
        success: false,
        error: "Car not found",
      };
    }

    // Check if car is wishlisted by user
    let isWishlisted = false;
    if (dbUser) {
      const { data: savedCar } = await supabase
        .from("UserSavedCar")
        .select("*")
        .eq("userId", dbUser.id)
        .eq("carId", carId)
        .single();

      isWishlisted = !!savedCar;
    }

    // Check if user has already booked a test drive for this car
    let userTestDrive: UserTestDrive | null = null;

    if (dbUser) {
      const { data: existingTestDrive } = await supabase
        .from("TestDriveBooking")
        .select("*")
        .eq("carId", carId)
        .eq("userId", dbUser.id)
        .in("status", [
          BookingStatus.PENDING,
          BookingStatus.CONFIRMED,
          BookingStatus.COMPLETED,
        ])
        .order("createdAt", { ascending: false })
        .limit(1)
        .single();

      if (existingTestDrive) {
        userTestDrive = {
          id: existingTestDrive.id,
          status: existingTestDrive.status,
          bookingDate: existingTestDrive.bookingDate,
        };
      }
    }

    // Get dealership info for test drive availability
    const { data: dealership } = await supabase
      .from("DealershipInfo")
      .select(
        `
        *,
        workingHours:WorkingHour(*)
      `,
      )
      .single();

    // Get existing bookings for this car to show unavailable slots
    const { data: existingBookings } = await supabase
      .from("TestDriveBooking")
      .select("bookingDate, startTime, endTime")
      .eq("carId", carId)
      .in("status", [BookingStatus.PENDING, BookingStatus.CONFIRMED])
      .gte("bookingDate", new Date().toISOString().split("T")[0]);

    return {
      success: true,
      data: {
        ...serializeCarData(car, isWishlisted),
        testDriveInfo: {
          userTestDrive,
          dealership: dealership || null,
          existingBookings: (existingBookings || []).map((booking) => ({
            date: booking.bookingDate,
            startTime: booking.startTime,
            endTime: booking.endTime,
          })),
        },
      },
    };
  } catch (error) {
    throw new Error("Error fetching car details:" + (error as Error).message);
  }
}
