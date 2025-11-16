"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { ROUTES } from "@/lib/routes";
import { AlertCircle, Calendar, Trash2, Settings, Pencil } from "lucide-react";
import {
  Car,
  Fuel,
  Gauge,
  LocateFixed,
  Share2,
  Heart,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
} from "lucide-react";
import { CarGallery } from "./car-gallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toggleSavedCar } from "@/actions/car-listing";
import useFetch from "@/hooks/use-fetch";
import { useCarAdmin } from "@/hooks/use-car-admin";
import { formatCurrency } from "@/lib/helpers";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  SerializedCar,
  UserTestDrive,
  SerializedDealershipInfo,
  SerializedWorkingHour,
} from "@/types";

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
  const { isSignedIn, openSignInModal } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(car.wishlisted);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    loading: savingCar,
    fn: toggleSavedCarFn,
    data: toggleResult,
    error: toggleError,
  } = useFetch(toggleSavedCar);

  const {
    deletingCar,
    updatingStatus,
    handleDeleteCar: deleteCarAction,
    handleUpdateStatus,
  } = useCarAdmin({
    onDeleteSuccess: () => {
      setShowDeleteDialog(false);
      router.push(ROUTES.ADMIN_CARS);
    },
    onUpdateSuccess: () => {
      router.refresh();
    },
  });

  // Handle toggle result with useEffect
  useEffect(() => {
    if (toggleResult?.success) {
      setIsWishlisted(toggleResult.data.saved);
      toast.success(toggleResult.data.message);
    }
  }, [toggleResult]);

  // Handle errors with useEffect
  useEffect(() => {
    if (toggleError) {
      toast.error("Failed to update favorites");
    }
  }, [toggleError]);

  // Handle save car
  const handleSaveCar = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to save cars");
      openSignInModal();
      return;
    }

    if (savingCar) return;

    // Use the toggleSavedCarFn from useFetch hook
    await toggleSavedCarFn(car.id);
  };

  // Handle share
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${car.year} ${car.make} ${car.model}`,
          text: `Check out this ${car.year} ${car.make} ${car.model} on Dealer name!`,
          url: window.location.href,
        })
        .catch((error) => {
          console.log("Error sharing", error);
          copyToClipboard();
        });
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

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
    router.push(ROUTES.ADMIN_TEST_DRIVES);
  };

  // Handle edit car
  const handleEditCar = () => {
    router.push(ROUTES.ADMIN_CAR_EDIT(car.id));
  };

  // Handle delete car
  const handleDeleteCar = async () => {
    await deleteCarAction(car.id);
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    await handleUpdateStatus(
      car.id,
      newStatus as "AVAILABLE" | "SOLD" | "UNAVAILABLE"
    );
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Image Gallery */}
        <div className="w-full lg:w-7/12">
          <CarGallery
            images={car.images || []}
            carName={`${car.year} ${car.make} ${car.model}`}
          />

          {/* Secondary Actions */}
          <div className="flex mt-4 gap-4">
            <Button
              variant="outline"
              className={`flex items-center gap-2 flex-1 ${
                isWishlisted ? "text-red-500" : ""
              }`}
              onClick={handleSaveCar}
              disabled={savingCar}
            >
              <Heart
                className={`h-5 w-5 ${isWishlisted ? "fill-red-500" : ""}`}
              />
              {isWishlisted ? "Saved" : "Save"}
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 flex-1"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
              Share
            </Button>
          </div>
        </div>

        {/* Car Details */}
        <div className="w-full lg:w-5/12">
          <div className="flex items-center justify-between">
            <Badge className="mb-2 text-lg px-3 py-1.5 font-mono tracking-wider">
              {car.numberPlate}
            </Badge>
          </div>

          <h1 className="text-4xl font-bold mb-1">
            {car.year} {car.make} {car.model}
          </h1>

          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(car.price)}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-6">
            <div className="flex items-center gap-2">
              <Gauge className="text-gray-500 h-5 w-5" />
              <span>{car.mileage.toLocaleString()} miles</span>
            </div>
            <div className="flex items-center gap-2">
              <Fuel className="text-gray-500 h-5 w-5" />
              <span>{car.fuelType}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="text-gray-500 h-5 w-5" />
              <span>{car.transmission}</span>
            </div>
          </div>

          {/* Contact Information - Hidden for admins */}
          {!isAdmin && (
            <Card className="my-6">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4">Have Questions?</h3>
                <div className="grid grid-cols-3 gap-3">
                  {/* Email Button */}
                  <a
                    href={`mailto:${testDriveInfo.dealership?.email || ""}`}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span className="text-xs font-medium">Email</span>
                    <span className="text-xs text-gray-600 text-center break-all">
                      {testDriveInfo.dealership?.email || "N/A"}
                    </span>
                  </a>

                  {/* Phone Button */}
                  <a
                    href={`tel:${testDriveInfo.dealership?.phone || ""}`}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="h-5 w-5 text-blue-600" />
                    <span className="text-xs font-medium">Phone</span>
                    <span className="text-xs text-gray-600 text-center">
                      {testDriveInfo.dealership?.phone || "N/A"}
                    </span>
                  </a>

                  {/* WhatsApp Button */}
                  <a
                    href={`https://wa.me/${
                      testDriveInfo.dealership?.whatsappPhone?.replace(
                        /[^0-9]/g,
                        ""
                      ) || ""
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-xs font-medium">WhatsApp</span>
                    <span className="text-xs text-gray-600 text-center">
                      {testDriveInfo.dealership?.whatsappPhone || "N/A"}
                    </span>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {(car.status === "SOLD" || car.status === "UNAVAILABLE") && (
            <Alert variant="destructive">
              <AlertTitle className="capitalize">
                This car is {car.status.toLowerCase()}
              </AlertTitle>
              <AlertDescription>Please check again later.</AlertDescription>
            </Alert>
          )}

          {/* Book Test Drive Button */}
          {car.status !== "SOLD" && car.status !== "UNAVAILABLE" && (
            <>
              {isAdmin ? (
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
                        <SelectItem value="AVAILABLE">Available</SelectItem>
                        <SelectItem value="SOLD">Sold</SelectItem>
                        <SelectItem value="UNAVAILABLE">Unavailable</SelectItem>
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
                        "EEEE, MMMM d, yyyy"
                      )}`
                    : "Book Test Drive"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Car</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this car? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deletingCar}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCar}
              disabled={deletingCar}
            >
              {deletingCar ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details & Features Section */}
      <div className="mt-12 p-6 bg-white rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-6">Description</h3>
            <p className="whitespace-pre-line text-gray-700">
              {car.description}
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-6">Features</h3>
            {car.features && car.features.length > 0 ? (
              <ul className="grid grid-cols-1 gap-2">
                {car.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
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
      <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Specifications</h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Make</span>
              <span className="font-medium">{car.make}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Model</span>
              <span className="font-medium">{car.model}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Year</span>
              <span className="font-medium">{car.year}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Body Type</span>
              <span className="font-medium">{car.bodyType}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Fuel Type</span>
              <span className="font-medium">{car.fuelType}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Transmission</span>
              <span className="font-medium">{car.transmission}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Mileage</span>
              <span className="font-medium">
                {car.mileage.toLocaleString()} miles
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Color</span>
              <span className="font-medium">{car.color}</span>
            </div>
            {car.seats && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Seats</span>
                <span className="font-medium">{car.seats}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dealership Location Section */}
      <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Dealership Location</h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex flex-col md:flex-row gap-6 justify-between">
            {/* Dealership Name and Address */}
            <div className="flex items-start gap-3 w-full">
              <div className="flex flex-col gap-5 flex-1 text-lg">
                <div className="flex items-start gap-3">
                  <LocateFixed className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <h4 className="font-medium">
                    {testDriveInfo.dealership?.name}
                  </h4>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  {testDriveInfo.dealership?.address ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        testDriveInfo.dealership.address
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-600 hover:underline transition-colors"
                    >
                      {testDriveInfo.dealership.address}
                    </a>
                  ) : (
                    <p className="text-gray-600">Not Available</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  {testDriveInfo.dealership?.phone ? (
                    <a
                      href={`tel:${testDriveInfo.dealership.phone}`}
                      className="text-gray-600 hover:text-blue-600 hover:underline transition-colors"
                    >
                      {testDriveInfo.dealership.phone}
                    </a>
                  ) : (
                    <p className="text-gray-600">Not Available</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  {testDriveInfo.dealership?.email ? (
                    <a
                      href={`mailto:${testDriveInfo.dealership.email}`}
                      className="text-gray-600 hover:text-blue-600 hover:underline transition-colors"
                    >
                      {testDriveInfo.dealership.email}
                    </a>
                  ) : (
                    <p className="text-gray-600">Not Available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div className="md:w-1/2 lg:w-1/3">
              <h4 className="font-medium text-lg mb-2">Working Hours</h4>
              <div className="space-y-2">
                {testDriveInfo.dealership?.workingHours
                  ? testDriveInfo.dealership.workingHours
                      .sort(
                        (
                          a: SerializedWorkingHour,
                          b: SerializedWorkingHour
                        ) => {
                          const days = [
                            "MONDAY",
                            "TUESDAY",
                            "WEDNESDAY",
                            "THURSDAY",
                            "FRIDAY",
                            "SATURDAY",
                            "SUNDAY",
                          ];
                          return (
                            days.indexOf(a.dayOfWeek) -
                            days.indexOf(b.dayOfWeek)
                          );
                        }
                      )
                      .map((day: SerializedWorkingHour) => (
                        <div
                          key={day.dayOfWeek}
                          className="flex justify-between text-md"
                        >
                          <span className="text-gray-600">
                            {day.dayOfWeek.charAt(0) +
                              day.dayOfWeek.slice(1).toLowerCase()}
                          </span>
                          <span>
                            {day.isOpen
                              ? `${day.openTime} - ${day.closeTime}`
                              : "Closed"}
                          </span>
                        </div>
                      ))
                  : // Default hours if none provided
                    [
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((day, index) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="text-gray-600">{day}</span>
                        <span>
                          {index < 5
                            ? "9:00 - 18:00"
                            : index === 5
                            ? "10:00 - 16:00"
                            : "Closed"}
                        </span>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
