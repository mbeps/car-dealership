import { CarsList } from "./_components/car-list";

/**
 * Cars management page metadata.
 * Describes the admin inventory management route.
 */
export const metadata = {
  title: "Cars Management",
  description: "Manage cars in your marketplace",
};

/**
 * Admin page for listing and managing marketplace cars.
 * Delegates inventory operations to the shared car list component.
 *
 * @returns Cars management page with the admin car list
 */
export default function CarsPage() {
  return (
    <div>
      <h1 className="mb-6 font-bold text-2xl">Cars Management</h1>
      <CarsList />
    </div>
  );
}
