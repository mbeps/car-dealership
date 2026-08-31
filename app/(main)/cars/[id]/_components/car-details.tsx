"use client";

import { format } from "date-fns";
import { Calendar, Car, Fuel, Gauge, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUTES } from "@/constants/routes";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";
import { useCarAdmin } from "@/hooks/use-car-admin";
import useAuthModal from "@/hooks/useAuthModal";
import { useUser } from "@/hooks/useUser";
import { formatCurrency } from "@/lib/helpers/format-currency";
import type { SerializedCar } from "@/types/car/serialized-car";
import type { SerializedDealershipInfo } from "@/types/dealership/serialized-dealership-info";
import type { UserTestDrive } from "@/types/test-drive/user-test-drive";
import { CarDealershipInfo } from "./car-dealership-info";
import { CarGallery } from "./car-gallery";
import { CarInquiryCard } from "./car-inquiry-card";
import { CarSecondaryActions } from "./car-secondary-actions";
import { CarSpecifications } from "./car-specifications";

/**
 * Car detail page content.
 * Displays car specs, images, wishlist toggle, share, and test-drive actions.
 * Admins see status selector and edit/delete actions.
 * Shows existing test-drive booking when present.
 * Includes dealership contact and location information for inquiries.
 *
 * @param car - Full car details with wishlist status.
 * @param testDriveInfo - User's booking, dealership contact, and location data.
 * @param isAdmin - Whether the current user is an admin.
 * @see CarGallery - Image carousel component.
 */
export function CarDetails({
  car,
  testDriveInfo,
  isAdmin = false,
}: {
  car: SerializedCar & { wishlisted: boolean };
  testDriveInfo: {
    userTestDrive: UserTestDrive | null;
    dealership: SerializedDealershipInfo | null;
  };
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const { user } = useUser();
  const isSignedIn = !!user;
  const { onOpen: openSignInModal } = useAuthModal();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    deletingCar,
    updatingStatus,
    handleDeleteCar: deleteCarAction,
    handleUpdateStatus,
  } = useCarAdmin({
    onDeleteSuccess: () => {
      setShowDeleteDialog(false);
      router.push(ROUTES.ADMIN.ADMIN_CARS);
    },
    onUpdateSuccess: () => {
      router.refresh();
    },
  });

  // Handle book test drive
  const handleBookTestDrive = () => {
    if (!isSignedIn) {
      toast.error("Please sign in to book a test drive");
      openSignInModal(ROUTES.TEST_DRIVE(car.id));
      return;
    }
    router.push(ROUTES.TEST_DRIVE(car.id));
  };

  // Handle admin redirect to test-drives page
  const handleAdminTestDrives = () => {
    router.push(ROUTES.ADMIN.ADMIN_TEST_DRIVES);
  };

  // Handle edit car
  const handleEditCar = () => {
    router.push(ROUTES.ADMIN.ADMIN_CAR_EDIT(car.id));
  };

  // Handle delete car
  const handleDeleteCar = async () => {
    await deleteCarAction(car.id);
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus) return;
    await handleUpdateStatus(car.id, newStatus as CarStatus);
  };

  const carTitle = `${car.year} ${car.make} ${car.model}`;

  return (
    <div>
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Image Gallery */}
        <div className="w-full lg:w-7/12">
          <CarGallery images={car.images || []} carName={carTitle} />
        </div>

        {/* Car Details */}
        <div className="w-full lg:w-5/12">
          <div className="flex items-center justify-between">
            <Badge className="mb-2 px-3 py-1.5 font-mono text-lg tracking-wider">
              {car.numberPlate}
            </Badge>
          </div>

          <h1 className="mb-1 font-bold text-4xl">{carTitle}</h1>

          <div className="font-bold text-2xl text-blue-600">
            {formatCurrency(car.price)}
          </div>

          {/* Quick Stats */}
          <div className="my-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-gray-500" />
              <span>{car.mileage.toLocaleString()} miles</span>
            </div>
            <div className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-gray-500" />
              <span>{car.fuelType}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-gray-500" />
              <span>{car.transmission}</span>
            </div>
          </div>

          {/* Contact Information - Hidden for admins */}
          {!isAdmin && <CarInquiryCard dealership={testDriveInfo.dealership} />}

          {(car.status === CarStatus.SOLD ||
            car.status === CarStatus.UNAVAILABLE) && (
            <Alert variant="destructive">
              <AlertTitle className="capitalize">
                This car is {car.status.toLowerCase()}
              </AlertTitle>
              <AlertDescription>Please check again later.</AlertDescription>
            </Alert>
          )}

          {/* Book Test Drive Button */}
          {car.status !== CarStatus.SOLD &&
            car.status !== CarStatus.UNAVAILABLE &&
            (isAdmin ? (
              <div className="space-y-3">
                <Button
                  className="w-full py-6 text-lg"
                  onClick={handleAdminTestDrives}
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Manage Test Drives
                </Button>

                {/* Admin Controls */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleEditCar}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Car
                  </Button>

                  <Select
                    value={car.status}
                    onValueChange={handleStatusChange}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CarStatus.AVAILABLE}>
                        Available
                      </SelectItem>
                      <SelectItem value={CarStatus.SOLD}>Sold</SelectItem>
                      <SelectItem value={CarStatus.UNAVAILABLE}>
                        Unavailable
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={deletingCar}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="w-full py-6 text-lg"
                onClick={handleBookTestDrive}
                disabled={!!testDriveInfo.userTestDrive}
              >
                <Calendar className="mr-2 h-5 w-5" />
                {testDriveInfo.userTestDrive
                  ? `Booked for ${format(
                      new Date(testDriveInfo.userTestDrive.bookingDate),
                      "EEEE, MMMM d, yyyy",
                    )}`
                  : "Book Test Drive"}
              </Button>
            ))}

          {/* Secondary Actions */}
          <CarSecondaryActions
            carId={car.id}
            numberPlate={car.numberPlate}
            carTitle={carTitle}
            initialWishlisted={car.wishlisted}
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Car</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this car? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingCar}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCar}
              disabled={deletingCar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingCar ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details & Features Section */}
      <div className="mt-12 rounded-lg bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-6 font-bold text-2xl">Description</h3>
            <p className="whitespace-pre-line text-gray-700">
              {car.description}
            </p>
          </div>
          <div>
            <h3 className="mb-6 font-bold text-2xl">Features</h3>
            {car.features && car.features.length > 0 ? (
              <ul className="grid grid-cols-1 gap-2">
                {car.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No features listed for this car.</p>
            )}
          </div>
        </div>
      </div>

      {/* Specifications Section */}
      <CarSpecifications car={car} />

      {/* Dealership Location Section */}
      <CarDealershipInfo dealership={testDriveInfo.dealership} />
    </div>
  );
}
