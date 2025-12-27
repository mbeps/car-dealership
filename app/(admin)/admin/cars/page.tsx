import { CarsList } from "./_components/car-list";
import { DEALERSHIP_NAME } from "@/constants/dealership-name";

export const metadata = {
  title: `Cars | ${DEALERSHIP_NAME} Admin`,
  description: "Manage cars in your marketplace",
};

export default function CarsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Cars Management</h1>
      <CarsList />
    </div>
  );
}
