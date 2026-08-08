import { notFound } from "next/navigation";
import { EditCarForm } from "./_components/edit-car-form";
import { getCarMakes } from "@/actions/cars/get-car-makes";
import { getCarColors } from "@/actions/cars/get-car-colors";
import { getCars } from "@/actions/cars/get-cars";

/**
 * Edit car page metadata.
 * Describes the admin route for updating an existing marketplace car.
 */
export const metadata = {
  title: "Edit Car",
  description: "Edit car details",
};

/**
 * Props for the admin car edit page.
 * Contains the car identifier resolved from the dynamic route.
 */
interface EditCarPageProps {
  /** Next.js route params, resolved as a Promise on App Router pages. */
  params: Promise<{
    /** ID of the car being edited. */
    id: string;
  }>;
}

/**
 * Admin page for editing an existing marketplace car.
 * Loads car options and validates that the requested car exists before rendering.
 *
 * @param params - Dynamic route params containing the car ID
 * @returns Edit Car page with the matching car and form options
 * @see EditCarForm for the client-side car edit form
 */
export default async function EditCarPage({ params }: EditCarPageProps) {
  const { id } = await params;

  const [carMakesResult, carColorsResult, carsResult] = await Promise.all([
    getCarMakes(),
    getCarColors(),
    getCars(),
  ]);

  const carMakes = carMakesResult.success ? carMakesResult.data : [];
  const carColors = carColorsResult.success ? carColorsResult.data : [];
  const cars = carsResult.success ? carsResult.data : [];

  const car = cars.find((c) => c.id === id);

  if (!car) {
    notFound();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Car</h1>
      <EditCarForm car={car} carMakes={carMakes} carColors={carColors} />
    </div>
  );
}
