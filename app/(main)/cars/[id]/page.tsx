import { notFound } from "next/navigation";
import { isCurrentUserAdmin } from "@/actions/auth/is-current-user-admin";
import { getCarById } from "@/actions/cars/get-car-by-id";
import { CarDetails } from "./_components/car-details";

/**
 * Generates SEO metadata for a car detail page.
 * Reads the car id from route params, uses `getCarById` to derive title, description, and Open Graph image.
 *
 * @param params - Route params containing the car id.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCarById(id);

  if (!result.success) {
    return {
      title: "Car Not Found",
      description: "The requested car could not be found",
    };
  }

  const car = result.data;

  return {
    title: `${car.year} ${car.make} ${car.model}`,
    description: car.description.substring(0, 160),
    openGraph: {
      images: car.images?.[0] ? [car.images[0]] : [],
    },
  };
}

/**
 * Server page for a single car detail page.
 * Fetches car details, redirects to Next.js not-found when unavailable, checks admin access, then renders details with user-specific state.
 *
 * @param params - Route params containing the car id.
 */
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
    <div className="py-12">
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
