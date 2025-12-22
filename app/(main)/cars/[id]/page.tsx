import { getCarById } from "@/actions/car-listing";
import { CarDetails } from "./_components/car-details";
import { notFound } from "next/navigation";
import { isCurrentUserAdmin } from "@/actions/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCarById(id);

  if (!result.success) {
    return {
      title: "Car Not Found | MN LTD Motors",
      description: "The requested car could not be found",
    };
  }

  const car = result.data;

  return {
    title: `${car.year} ${car.make} ${car.model} | MN LTD`,
    description: car.description.substring(0, 160),
    openGraph: {
      images: car.images?.[0] ? [car.images[0]] : [],
    },
  };
}

export default async function CarDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Fetch car details
  const { id } = await params;
  const result = await getCarById(id);

  // If car not found, show 404
  if (!result.success) {
    notFound();
  }

  // Check if user is admin
  const isAdmin = await isCurrentUserAdmin();

  return (
    <div className="container mx-auto px-4 py-12">
      <CarDetails
        car={{
          ...result.data,
          wishlisted: result.data.wishlisted ?? false,
        }}
        testDriveInfo={result.data.testDriveInfo}
        isAdmin={isAdmin}
      />
    </div>
  );
}
