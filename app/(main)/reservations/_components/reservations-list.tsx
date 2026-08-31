"use client";

import { Calendar } from "lucide-react";
import Link from "next/link";
import { cancelTestDrive } from "@/actions/test-drive/cancel-test-drive";
import { TestDriveCard } from "@/components/test-drive-card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { BookingStatusEnum as BookingStatus } from "@/enums/booking-status";
import useFetch from "@/hooks/use-fetch";
import type { ActionResponse } from "@/types/common/action-response";
import type { TestDriveBookingWithCar } from "@/types/test-drive/test-drive-booking-with-car";

/**
 * Renders user test-drive reservations.
 * Groups bookings into upcoming and past.
 * Allows cancelling eligible bookings via card actions.
 * Shows empty state with CTA to browse cars.
 *
 * @param initialData - Server-fetched bookings.
 * @see getUserTestDrives - Server action fetching bookings.
 * @see TestDriveCard - Individual booking card.
 * @see cancelTestDrive - Server action for cancellation.
 */
export function ReservationsList({
  initialData,
}: {
  initialData: ActionResponse<TestDriveBookingWithCar[]>;
}) {
  const { loading: cancelling, fn: cancelBookingFn } =
    useFetch(cancelTestDrive);

  // Handle cancellation
  const handleCancelBooking = async (bookingId: string) => {
    await cancelBookingFn(bookingId);
  };

  // Group bookings by status
  const upcomingBookings = initialData?.success
    ? initialData.data.filter((booking: TestDriveBookingWithCar) =>
        [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(
          booking.status as BookingStatus,
        ),
      )
    : [];

  const pastBookings = initialData?.success
    ? initialData.data.filter((booking: TestDriveBookingWithCar) =>
        [
          BookingStatus.COMPLETED,
          BookingStatus.CANCELLED,
          BookingStatus.NO_SHOW,
        ].includes(booking.status as BookingStatus),
      )
    : [];

  // No reservations
  if (initialData?.success && initialData.data.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border bg-gray-50 p-8 text-center">
        <div className="mb-4 rounded-full bg-gray-100 p-4">
          <Calendar className="h-8 w-8 text-gray-500" />
        </div>
        <h3 className="mb-2 font-medium text-lg">No Reservations Found</h3>
        <p className="mb-6 max-w-md text-gray-500">
          You don't have any test drive reservations yet. Browse our cars and
          book a test drive to get started.
        </p>
        <Button variant="default" render={<Link href={ROUTES.HOME.CARS} />}>
          Browse Cars
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Bookings */}
      <div>
        <h2 className="mb-4 font-bold text-2xl">Upcoming Test Drives</h2>
        {upcomingBookings.length === 0 ? (
          <p className="text-gray-500 italic">No upcoming test drives.</p>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking: TestDriveBookingWithCar) => (
              <TestDriveCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancelBooking}
                isCancelling={cancelling}
                showActions
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <h2 className="mb-4 font-bold text-2xl">Past Test Drives</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {pastBookings.map((booking: TestDriveBookingWithCar) => (
              <TestDriveCard
                key={booking.id}
                booking={booking}
                showActions={false}
                isPast
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
