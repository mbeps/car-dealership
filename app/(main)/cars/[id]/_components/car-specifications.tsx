import type { SerializedCar } from "@/types/car/serialized-car";

export interface CarSpecificationsProps {
  car: Pick<
    SerializedCar,
    | "make"
    | "model"
    | "year"
    | "bodyType"
    | "fuelType"
    | "transmission"
    | "mileage"
    | "color"
    | "seats"
  >;
}

/**
 * 2-column tabular breakdown of vehicle technical specifications.
 */
export function CarSpecifications({ car }: CarSpecificationsProps) {
  return (
    <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-6 font-bold text-2xl">Specifications</h2>
      <div className="rounded-lg bg-gray-50 p-6">
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          <div className="flex justify-between border-b py-2">
            <span className="text-gray-600">Make</span>
            <span className="font-medium">{car.make}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-gray-600">Model</span>
            <span className="font-medium">{car.model}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-gray-600">Year</span>
            <span className="font-medium">{car.year}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-gray-600">Body Type</span>
            <span className="font-medium">{car.bodyType}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-gray-600">Fuel Type</span>
            <span className="font-medium">{car.fuelType}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-gray-600">Transmission</span>
            <span className="font-medium">{car.transmission}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-gray-600">Mileage</span>
            <span className="font-medium">
              {car.mileage.toLocaleString()} miles
            </span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-gray-600">Color</span>
            <span className="font-medium">{car.color}</span>
          </div>
          {car.seats && (
            <div className="flex justify-between border-b py-2">
              <span className="text-gray-600">Seats</span>
              <span className="font-medium">{car.seats}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
