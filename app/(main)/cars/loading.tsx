import CarListingsLoading from "@/app/(main)/cars/_components/car-listing-loading";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the cars catalog page.
 *
 * Renders header and filter placeholders alongside the car grid skeleton.
 *
 * @returns The cars page loading skeleton UI.
 */
export default function CarsLoading() {
  return (
    <div className="py-12">
      <Skeleton className="mb-4 h-14 w-72" />
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filter skeleton sidebar */}
        <div className="w-full shrink-0 lg:w-80">
          <div className="space-y-6 rounded-lg border p-5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        {/* Listings grid skeleton */}
        <div className="flex-1">
          <CarListingsLoading />
        </div>
      </div>
    </div>
  );
}
