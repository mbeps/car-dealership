"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import {
  Calendar as CalendarIcon,
  Car,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { bookTestDrive } from "@/actions/test-drive/book-test-drive";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEALERSHIP_NAME } from "@/constants/dealership-name";
import { ROUTES } from "@/constants/routes";
import type { DayOfWeekEnum } from "@/enums/day-of-week";
import useFetch from "@/hooks/use-fetch";
import { formatCurrency } from "@/lib/helpers/format-currency";
import { cn } from "@/lib/utils";
import { type TestDriveFormData, testDriveSchema } from "@/schemas/test-drive";
import type { SerializedCar } from "@/types/car/serialized-car";
import type { SerializedDealershipInfo } from "@/types/dealership/serialized-dealership-info";
import type { UserTestDrive } from "@/types/test-drive/user-test-drive";

interface BookingDetails {
  carId: string;
  date: string;
  timeSlot: string;
  notes?: string;
}

interface ExistingBooking {
  date: string;
  startTime: string;
  endTime: string;
}

interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

/**
 * Test drive booking form.
 * Validates date against dealership working hours and existing bookings.
 * Generates available time slots from the dealership schedule.
 * Filters out already-booked slots for the selected date.
 * Shows a confirmation dialog after successful submission.
 *
 * @param car - Car to book a test drive for.
 * @param testDriveInfo - Existing booking, dealership, and booked slots.
 * @see testDriveSchema - Form validation schema.
 * @see bookTestDrive - Server action for booking.
 */
export function TestDriveForm({
  car,
  testDriveInfo,
}: {
  car: SerializedCar;
  testDriveInfo: {
    userTestDrive: UserTestDrive | null;
    dealership: SerializedDealershipInfo | null;
    existingBookings: ExistingBooking[];
  };
}) {
  const router = useRouter();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(
    null,
  );

  // Initialize react-hook-form with zod resolver
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(testDriveSchema),
    defaultValues: {
      date: undefined,
      timeSlot: undefined,
      notes: "",
    },
  });

  // Get dealership and booking information
  const dealership = testDriveInfo?.dealership;
  // Use useMemo to avoid changing existingBookings reference on every render
  const existingBookings = useMemo(
    () => testDriveInfo?.existingBookings || [],
    [testDriveInfo?.existingBookings],
  );

  // Watch date field to update available time slots
  const selectedDate = useWatch({ control, name: "date" });

  // Custom hooks for API calls
  const { loading: bookingInProgress, fn: bookTestDriveFn } =
    useFetch(bookTestDrive);

  // Update available time slots when date changes
  const availableTimeSlots = useMemo<TimeSlot[]>(() => {
    if (!selectedDate || !dealership?.workingHours) return [];

    const selectedDayOfWeek = format(
      selectedDate,
      "EEEE",
    ).toUpperCase() as DayOfWeekEnum;

    // Find working hours for the selected day
    const daySchedule = dealership.workingHours.find(
      (day) => day.dayOfWeek === selectedDayOfWeek,
    );

    if (!daySchedule?.isOpen) {
      return [];
    }

    // Parse opening and closing hours
    const openHour = parseInt(daySchedule.openTime.split(":")[0], 10);
    const closeHour = parseInt(daySchedule.closeTime.split(":")[0], 10);

    // Generate time slots (every hour)
    const slots = [];
    for (let hour = openHour; hour < closeHour; hour++) {
      const startTime = `${hour.toString().padStart(2, "0")}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;

      // Check if this slot is already booked
      const isBooked = existingBookings.some((booking) => {
        return (
          booking.date === format(selectedDate, "yyyy-MM-dd") &&
          booking.startTime === startTime
        );
      });

      if (!isBooked) {
        slots.push({
          id: `${startTime}-${endTime}`,
          label: `${startTime} - ${endTime}`,
          startTime,
          endTime,
        });
      }
    }

    return slots;
  }, [selectedDate, dealership, existingBookings]);

  // Clear time slot selection when date changes
  useEffect(() => {
    if (selectedDate) {
      setValue("timeSlot", "");
    }
  }, [selectedDate, setValue]);

  // Create a function to determine which days should be disabled
  const isDayDisabled = (day: Date) => {
    // Disable past dates
    if (day < new Date()) {
      return true;
    }

    // Get day of week
    const dayOfWeek = format(day, "EEEE").toUpperCase() as DayOfWeekEnum;

    // Find working hours for the day
    const daySchedule = dealership?.workingHours?.find(
      (schedule) => schedule.dayOfWeek === dayOfWeek,
    );

    // Disable if dealership is closed on this day
    return !daySchedule?.isOpen;
  };

  // Submit handler
  const onSubmit = async (data: TestDriveFormData) => {
    const selectedSlot = availableTimeSlots.find(
      (slot) => slot.id === data.timeSlot,
    );

    if (!selectedSlot) {
      toast.error("Selected time slot is not available");
      return;
    }

    const result = await bookTestDriveFn({
      carId: car.id,
      bookingDate: format(data.date, "yyyy-MM-dd"),
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      notes: data.notes || "",
    });

    if (result?.success) {
      setBookingDetails({
        carId: car.id,
        date: format(result.data.bookingDate, "EEEE, MMMM d, yyyy"),
        timeSlot: `${format(
          parseISO(`2022-01-01T${result.data.startTime}`),
          "h:mm a",
        )} - ${format(
          parseISO(`2022-01-01T${result.data.endTime}`),
          "h:mm a",
        )}`,
        notes: result.data.notes ?? undefined,
      });
      setShowConfirmation(true);
      reset();
    }
  };

  // Close confirmation handler
  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    router.push(ROUTES.HOME.CAR_DETAILS(car.id));
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {/* Left Column - Car Summary */}
      <div className="md:col-span-1">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 font-bold text-xl">Car Details</h2>

            <div className="relative mb-4 aspect-video overflow-hidden rounded-lg">
              {car.images && car.images.length > 0 ? (
                <Image
                  src={car.images[0]}
                  alt={`${car.year} ${car.make} ${car.model}`}
                  className="h-full w-full object-cover"
                  width={400}
                  height={225}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200">
                  <Car className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            <h3 className="font-bold text-lg">
              {car.year} {car.make} {car.model}
            </h3>

            <div className="mt-2 font-bold text-blue-600 text-xl">
              {formatCurrency(car.price)}
            </div>

            <div className="mt-4 text-gray-500 text-sm">
              <div className="flex justify-between border-b py-1">
                <span>Mileage</span>
                <span className="font-medium">
                  {car.mileage.toLocaleString()} miles
                </span>
              </div>
              <div className="flex justify-between border-b py-1">
                <span>Fuel Type</span>
                <span className="font-medium">{car.fuelType}</span>
              </div>
              <div className="flex justify-between border-b py-1">
                <span>Transmission</span>
                <span className="font-medium">{car.transmission}</span>
              </div>
              <div className="flex justify-between border-b py-1">
                <span>Body Type</span>
                <span className="font-medium">{car.bodyType}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Color</span>
                <span className="font-medium">{car.color}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dealership Info */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="mb-4 font-bold text-xl">Dealership Info</h2>
            <div className="text-sm">
              <p className="font-medium">
                {testDriveInfo.dealership?.name || DEALERSHIP_NAME}
              </p>
              <p className="mt-1 text-gray-600">
                {dealership?.address || "Address not available"}
              </p>
              <p className="mt-3 text-gray-600">
                <span className="font-medium">Phone:</span>{" "}
                {dealership?.phone || "Not available"}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Email:</span>{" "}
                {dealership?.email || "Not available"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Booking Form */}
      <div className="md:col-span-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-6 font-bold text-xl">Schedule Your Test Drive</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Date Selection */}
              <div className="space-y-2">
                <label className="block font-medium text-sm">
                  Select a Date
                </label>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            />
                          }
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(field.value, "PPP")
                            : "Pick a date"}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={isDayDisabled}
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.date && (
                        <p className="mt-1 font-medium text-red-500 text-sm">
                          {errors.date.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Time Slot Selection */}
              <div className="space-y-2">
                <label className="block font-medium text-sm">
                  Select a Time Slot
                </label>
                <Controller
                  name="timeSlot"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={
                          !selectedDate || availableTimeSlots.length === 0
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !selectedDate
                                ? "Please select a date first"
                                : availableTimeSlots.length === 0
                                  ? "No available slots on this date"
                                  : "Select a time slot"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTimeSlots.map((slot) => (
                            <SelectItem key={slot.id} value={slot.id}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.timeSlot && (
                        <p className="mt-1 font-medium text-red-500 text-sm">
                          {errors.timeSlot.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="block font-medium text-sm">
                  Additional Notes (Optional)
                </label>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder="Any specific questions or requests for your test drive?"
                      className="min-h-24"
                    />
                  )}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={bookingInProgress}
              >
                {bookingInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking Your Test Drive...
                  </>
                ) : (
                  "Book Test Drive"
                )}
              </Button>
            </form>

            {/* Instructions */}
            <div className="mt-8 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-medium">What to expect</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start">
                  <CheckCircle2 className="mt-0.5 mr-2 h-4 w-4 text-green-500" />
                  Bring your driver's license for verification
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="mt-0.5 mr-2 h-4 w-4 text-green-500" />
                  Test drives typically last 30-60 minutes
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="mt-0.5 mr-2 h-4 w-4 text-green-500" />
                  A dealership representative will accompany you
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Test Drive Booked Successfully
            </DialogTitle>
            <DialogDescription>
              Your test drive has been confirmed with the following details:
            </DialogDescription>
          </DialogHeader>

          {bookingDetails && (
            <div className="py-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Car:</span>
                  <span>
                    {car.year} {car.make} {car.model}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date:</span>
                  <span>{bookingDetails.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Time Slot:</span>
                  <span>{bookingDetails.timeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Dealership:</span>
                  <span>
                    {testDriveInfo.dealership?.name || DEALERSHIP_NAME}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded bg-blue-50 p-3 text-blue-700 text-sm">
                Please arrive 10 minutes early with your driver's license.
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleCloseConfirmation}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
