import { notFound } from "next/navigation";
import { EditCarForm } from "./_components/edit-car-form";
import { getCarMakes } from "@/actions/car-makes";
import { getCarColors } from "@/actions/car-colors";
import { getCars } from "@/actions/cars";

export const metadata = {
  title: "Edit Car | MN LTD Motors Admin",
  description: "Edit car details",
};

interface EditCarPageProps {
  params: Promise<{
    id: string;
  }>;
}

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
