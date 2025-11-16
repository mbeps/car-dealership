import { AddCarForm } from "./_components/add-car-form";
import { getCarMakes } from "@/actions/car-makes";

export const metadata = {
  title: "Add New Car | Maruf Motors Admin",
  description: "Add a new car to the marketplace",
};

export default async function AddCarPage() {
  const carMakesResult = await getCarMakes();
  const carMakes = carMakesResult.success ? carMakesResult.data : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Car</h1>
      <AddCarForm carMakes={carMakes} />
    </div>
  );
}
