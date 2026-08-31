"use client";

import { format, parseISO } from "date-fns";
import { ArrowRight, Calendar, Car, Clock, Loader2, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { BookingStatusEnum as BookingStatus } from "@/enums/booking-status";
import type { TestDriveBookingWithCar } from "@/types/test-drive/test-drive-booking-with-car";
import type { TestDriveBookingWithUser } from "@/types/test-drive/test-drive-booking-with-user";

/**
 * Formats a stored time string as a readable AM/PM value.
 * Falls back to the original value when the time cannot be parsed.
 *
 * @param timeString - Time string in HH:mm format
 * @returns Formatted time string, or the original string when parsing fails
 */
const formatTime = (timeString: string): string => {
  try {
    return format(parseISO(`2022-01-01T${timeString}`), "h:mm a");
  } catch {
    return timeString;
  }
};

/**
 * Returns a badge for a test drive booking status.
 *
 * @param status - Booking status to display.
 * @returns React badge element for the status.
 * @see BookingStatusEnum - Available booking statuses.
 */
const getStatusBadge = (status: BookingStatus) => {
  switch (status) {
    case BookingStatus.PENDING:
      return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
    case BookingStatus.CONFIRMED:
      return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
    case BookingStatus.COMPLETED:
      return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
    case BookingStatus.CANCELLED:
      return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
    case BookingStatus.NO_SHOW:
      return <Badge className="bg-red-100 text-red-800">No Show</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

/**
 * Props for a test drive booking card.
 */
interface TestDriveCardProps {
  booking: TestDriveBookingWithCar | TestDriveBookingWithUser;
  onCancel?: (bookingId: string) => Promise<void>;
  showActions?: boolean;
  isPast?: boolean;
  isAdmin?: boolean;
  isCancelling?: boolean;
  renderStatusSelector?: () => React.ReactNode;
}

/**
 * Displays a test drive booking with car details and optional actions.
 *
 * @param booking - Booking data to render.
 * @param onCancel - Optional callback for cancelling the booking.
 * @param showActions - Whether action buttons and confirmation dialog are shown.
 * @param isPast - Whether the booking should appear past.
 * @param isAdmin - Whether customer details and admin actions should be shown.
 * @param isCancelling - Whether cancellation is in progress.
 * @param renderStatusSelector - Optional custom status selector.
 * @returns Test drive booking card.
 * @see BookingStatusEnum - Available booking statuses.
 */
export function TestDriveCard({
  booking,
  onCancel,
  showActions = true,
  isPast = false,
  isAdmin = false,
  isCancelling = false,
  renderStatusSelector = () => null,
}: TestDriveCardProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  /**
   * Cancels the booking when a cancellation callback is available.
   */
  const handleCancel = async () => {
    if (!onCancel) return;

    await onCancel(booking.id);
    setCancelDialogOpen(false);
  };

  /**
   * Checks whether a booking includes customer details.
   *
   * @param booking - Booking to inspect.
   * @returns true when the booking includes user details.
   */
  const hasUser = (
    booking: TestDriveBookingWithCar | TestDriveBookingWithUser,
  ): booking is TestDriveBookingWithUser => {
    return "user" in booking;
  };

  return (
    <>
      <Card
        className={`overflow-hidden ${
          isPast ? "opacity-80 transition-opacity hover:opacity-100" : ""
        }`}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Car Image - Left */}
          <div className="relative h-40 sm:h-auto sm:w-1/4">
            {booking.car.images && booking.car.images.length > 0 ? (
              <div className="relative h-full w-full">
                <Image
                  src={booking.car.images[0]}
                  alt={`${booking.car.make} ${booking.car.model}`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-200">
                <Car className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <div className="absolute top-2 right-2 sm:hidden">
              {getStatusBadge(booking.status)}
            </div>
          </div>

          {/* Booking Details - Middle */}
          <div className="p-4 sm:w-1/2 sm:flex-1">
            <div className="mb-2 hidden sm:block">
              {getStatusBadge(booking.status)}
            </div>

            <h3 className="mb-1 font-bold text-lg">
              {booking.car.year} {booking.car.make} {booking.car.model}{" "}
            </h3>
            {renderStatusSelector()}

            <div className="my-2 space-y-2">
              <div className="flex items-center text-gray-600">
                <Calendar className="mr-2 h-4 w-4" />
                {format(new Date(booking.bookingDate), "EEEE, MMMM d, yyyy")}
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="mr-2 h-4 w-4" />
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </div>

              {/* Show customer info in admin view */}
              {isAdmin && hasUser(booking) && booking.user && (
                <div className="flex items-center text-gray-600">
                  <User className="mr-2 h-4 w-4" />
                  {booking.user.name || booking.user.email}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Right */}
          {showActions && (
            <div className="flex flex-col justify-center gap-2 border-t p-4 sm:w-1/4 sm:border-t-0 sm:border-l">
              {/* Show notes if any */}
              {booking.notes && (
                <div className="w-full rounded bg-gray-50 p-2 text-sm">
                  <p className="font-medium">Notes:</p>
                  <p className="text-gray-600">{booking.notes}</p>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                render={
                  <Link
                    href={ROUTES.HOME.CAR_DETAILS(booking.carId)}
                    className="flex items-center justify-center"
                  />
                }
              >
                View Car
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {(booking.status === BookingStatus.PENDING ||
                booking.status === BookingStatus.CONFIRMED) && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Cancel"
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Cancel Confirmation Dialog */}
      {onCancel && (
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Test Drive</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel your test drive for the{" "}
                {booking.car.year} {booking.car.make} {booking.car.model}? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="py-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Date:</span>
                  <span>
                    {format(
                      new Date(booking.bookingDate),
                      "EEEE, MMMM d, yyyy",
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Time:</span>
                  <span>
                    {formatTime(booking.startTime)} -{" "}
                    {formatTime(booking.endTime)}
                  </span>
                </div>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCancelling}>
                Keep Reservation
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                disabled={isCancelling}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel Reservation"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
