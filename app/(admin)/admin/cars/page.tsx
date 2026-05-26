import { CarsList } from "./_components/car-list";

export const metadata = {
  title: "Cars Management",
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
