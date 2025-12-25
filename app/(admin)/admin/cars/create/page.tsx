import { AddCarForm } from "./_components/add-car-form";
import { DEALERSHIP_NAME } from "@/constants/dealership-name";
import { getCarMakes } from "@/actions/car-makes";
import { getCarColors } from "@/actions/car-colors";

export const metadata = {
  title: `Add New Car | ${DEALERSHIP_NAME} Admin`,
  description: "Add a new car to the marketplace",
};

export default async function AddCarPage() {
  const [carMakesResult, carColorsResult] = await Promise.all([
    getCarMakes(),
    getCarColors(),
  ]);
  const carMakes = carMakesResult.success ? carMakesResult.data : [];
  const carColors = carColorsResult.success ? carColorsResult.data : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Car</h1>
      <AddCarForm carMakes={carMakes} carColors={carColors} />
    </div>
  );
}
