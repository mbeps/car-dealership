import { getCarColors } from "@/actions/cars/get-car-colors";
import { getCarMakes } from "@/actions/cars/get-car-makes";
import { AddCarForm } from "./_components/add-car-form";

/**
 * Add car page metadata.
 * Describes the admin route for creating a new marketplace car.
 */
export const metadata = {
  title: "Add New Car",
  description: "Add a new car to the marketplace",
};

/**
 * Admin page for adding a new marketplace car.
 * Loads make and color options once before rendering the creation form.
 *
 * @returns Add Car page with preloaded car makes and colors
 * @see AddCarForm for the client-side car creation form
 */
export default async function AddCarPage() {
  const [carMakesResult, carColorsResult] = await Promise.all([
    getCarMakes(),
    getCarColors(),
  ]);
  const carMakes = carMakesResult.success ? carMakesResult.data : [];
  const carColors = carColorsResult.success ? carColorsResult.data : [];

  return (
    <div className="p-6">
      <h1 className="mb-6 font-bold text-2xl">Add New Car</h1>
      <AddCarForm carMakes={carMakes} carColors={carColors} />
    </div>
  );
}
