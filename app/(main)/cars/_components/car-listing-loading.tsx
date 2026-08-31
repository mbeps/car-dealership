import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the car inventory grid.
 * Provides the same card grid shape while listings are fetched.
 */
const CarListingsLoading = () => {
  return (
    <>
      <Skeleton className="mb-5 h-8 w-40" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border">
              <Skeleton className="h-48 w-full" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 flex-1" />
                </div>
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default CarListingsLoading;
