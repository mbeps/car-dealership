import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton UI for the car details dynamic route.
 *
 * Renders placeholders for the gallery carousel, car metadata, pricing, features, and action cards.
 *
 * @returns The car detail loading skeleton UI.
 */
export default function CarDetailsLoading() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Back Link Placeholder */}
        <Skeleton className="mb-6 h-6 w-32" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content (Images + Specs) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Image Gallery Skeleton */}
            <Skeleton className="aspect-video w-full rounded-xl" />

            {/* Thumbnail Skeletons */}
            <div className="flex gap-2">
              <Skeleton className="h-20 w-28 rounded-lg" />
              <Skeleton className="h-20 w-28 rounded-lg" />
              <Skeleton className="h-20 w-28 rounded-lg" />
            </div>

            {/* Car Title & Key Info */}
            <div className="space-y-2">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
            </div>

            {/* Overview / Specs Grid */}
            <div className="grid grid-cols-2 gap-4 rounded-xl border p-6 md:grid-cols-4">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-3/4" />
                  </div>
                ))}
            </div>

            {/* Description Skeleton */}
            <div className="space-y-3 rounded-xl border p-6">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>

          {/* Sidebar / Booking Card */}
          <div className="space-y-6">
            <div className="space-y-4 rounded-xl border p-6 shadow-xs">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <div className="space-y-2 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
