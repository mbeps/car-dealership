"use client";

import { AlertCircle, CalendarRange, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAdminTestDrives } from "@/actions/admin/get-admin-test-drives";
import { updateTestDriveStatus } from "@/actions/admin/update-test-drive-status";
import { cancelTestDrive } from "@/actions/test-drive/cancel-test-drive";
import { TestDriveCard } from "@/components/test-drive-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookingStatusEnum as BookingStatus } from "@/enums/booking-status";
import useFetch from "@/hooks/use-fetch";

/**
 * Admin test drive management page.
 * Search by car/user, filter by status.
 * Inline status selector for each booking.
 * Cancel button for non-cancelled bookings.
 * Refetches after mutations.
 *
 * @see getAdminTestDrives - Server action with filters
 * @see updateTestDriveStatus - Admin status updates
 * @see cancelTestDrive - Cancellation action
 * @see TestDriveCard - Reused booking card
 */
export const TestDrivesList = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Custom hooks for API calls
  const {
    loading: fetchingTestDrives,
    fn: fetchTestDrives,
    data: testDrivesData,
    error: testDrivesError,
  } = useFetch(getAdminTestDrives);

  const {
    loading: updatingStatus,
    fn: updateStatusFn,
    data: updateResult,
    error: updateError,
  } = useFetch(updateTestDriveStatus);

  const {
    loading: cancelling,
    fn: cancelTestDriveFn,
    data: cancelResult,
    error: cancelError,
  } = useFetch(cancelTestDrive);

  // Initial fetch and refetch on search/filter changes
  useEffect(() => {
    const actualStatus = statusFilter === "all" ? "" : statusFilter;
    fetchTestDrives({ search, status: actualStatus });
  }, [search, statusFilter, fetchTestDrives]);

  // Handle errors
  useEffect(() => {
    if (testDrivesError) {
      toast.error("Failed to load test drives");
    }
    if (updateError) {
      toast.error("Failed to update test drive status");
    }
    if (cancelError) {
      toast.error("Failed to cancel test drive");
    }
  }, [testDrivesError, updateError, cancelError]);

  // Handle successful operations
  useEffect(() => {
    if (updateResult?.success) {
      toast.success("Test drive status updated successfully");
      const actualStatus = statusFilter === "all" ? "" : statusFilter;
      fetchTestDrives({ search, status: actualStatus });
    }
    if (cancelResult?.success) {
      toast.success("Test drive cancelled successfully");
      const actualStatus = statusFilter === "all" ? "" : statusFilter;
      fetchTestDrives({ search, status: actualStatus });
    }
  }, [updateResult, cancelResult, statusFilter, search, fetchTestDrives]);

  /**
   * Submit search and status filters, then reload bookings.
   *
   * @param e - Form submit event
   * @returns Nothing
   */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actualStatus = statusFilter === "all" ? "" : statusFilter;
    fetchTestDrives({ search, status: actualStatus });
  };

  /**
   * Update a booking status through the admin update action.
   *
   * @param bookingId - Booking ID to update
   * @param newStatus - New booking status
   * @returns Nothing
   */
  const handleUpdateStatus = async (
    bookingId: string,
    newStatus: BookingStatus,
  ) => {
    if (newStatus) {
      await updateStatusFn(bookingId, newStatus);
    }
  };

  /**
   * Cancel a test-drive booking through the admin cancel action.
   *
   * @param bookingId - Booking ID to cancel
   * @returns Nothing
   */
  const handleCancel = async (bookingId: string) => {
    await cancelTestDriveFn(bookingId);
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex w-full flex-col gap-4 sm:flex-row">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value ?? "all")}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={BookingStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={BookingStatus.CONFIRMED}>Confirmed</SelectItem>
              <SelectItem value={BookingStatus.COMPLETED}>Completed</SelectItem>
              <SelectItem value={BookingStatus.CANCELLED}>Cancelled</SelectItem>
              <SelectItem value={BookingStatus.NO_SHOW}>No Show</SelectItem>
            </SelectContent>
          </Select>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex w-full">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search by car or customer..."
                className="w-full pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" className="ml-2">
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* Test Drives List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5" />
            Test Drive Bookings
          </CardTitle>
          <CardDescription>
            Manage all test drive reservations and update their status
          </CardDescription>
        </CardHeader>

        <CardContent>
          {fetchingTestDrives && !testDrivesData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : testDrivesError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load test drives. Please try again.
              </AlertDescription>
            </Alert>
          ) : testDrivesData?.success && testDrivesData.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <CalendarRange className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="mb-1 font-medium text-gray-900 text-lg">
                No test drives found
              </h3>
              <p className="mb-4 text-gray-500">
                {statusFilter || search
                  ? "No test drives match your search criteria"
                  : "There are no test drive bookings yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {testDrivesData?.success &&
                testDrivesData.data.map((booking) => (
                  <div key={booking.id} className="relative">
                    <TestDriveCard
                      booking={booking}
                      onCancel={handleCancel}
                      showActions={[
                        BookingStatus.PENDING,
                        BookingStatus.CONFIRMED,
                      ].includes(booking.status as BookingStatus)}
                      isAdmin={true}
                      isCancelling={cancelling}
                      renderStatusSelector={() => (
                        <Select
                          value={booking.status}
                          onValueChange={(value) => {
                            if (value) {
                              handleUpdateStatus(
                                booking.id,
                                value as BookingStatus,
                              );
                            }
                          }}
                          disabled={updatingStatus}
                        >
                          <SelectTrigger className="h-8 w-full">
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={BookingStatus.PENDING}>
                              Pending
                            </SelectItem>
                            <SelectItem value={BookingStatus.CONFIRMED}>
                              Confirmed
                            </SelectItem>
                            <SelectItem value={BookingStatus.COMPLETED}>
                              Completed
                            </SelectItem>
                            <SelectItem value={BookingStatus.CANCELLED}>
                              Cancelled
                            </SelectItem>
                            <SelectItem value={BookingStatus.NO_SHOW}>
                              No Show
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
