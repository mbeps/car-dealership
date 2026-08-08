import { CarFilters } from "./_components/car-filters";
import { getCarFilters } from "@/actions/cars/get-car-filters";
import { CarListings } from "./_components/cars-listing";

/**
 * Defines SEO metadata for the car inventory page.
 *
 * @see CarsPage - Server page component that fetches filters and renders listings.
 */
export const metadata = {
  title: "Cars",
  description: "Browse and search for your dream car",
};

/**
 * Server page for browsing car inventory.
 * Fetches available filter options, shows an error state when filter loading fails, then renders filters beside the listing.
 *
 * @see getCarFilters - Server action for available inventory filters.
 * @see CarFilters - Client component that renders filter controls.
 * @see CarListings - Client component that renders searchable inventory.
 */
export default async function CarsPage() {
  // Fetch filters data on the server
  const filtersData = await getCarFilters();

  if (!filtersData.success) {
    return (
      <div className="py-12">
        <p>Error loading filters</p>
      </div>
    );
  }

  return (
    <div className="py-12">
      <h1 className="text-6xl mb-4 gradient-title">Browse Cars</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Section */}
        <div className="w-full lg:w-80 shrink-0">
          <CarFilters filters={filtersData.data} />
        </div>

        {/* Car Listings */}
        <div className="flex-1">
          <CarListings />
        </div>
      </div>
    </div>
  );
}
