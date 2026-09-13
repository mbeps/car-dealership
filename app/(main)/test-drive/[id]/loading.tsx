import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton UI for the test drive dynamic booking route.
 *
 * Renders placeholders for the heading, car preview card, and scheduling form fields.
 *
 * @returns The test drive loading skeleton UI.
 */
export default function TestDriveLoading() {
  return (
    <div className="py-12">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Page Title Placeholder */}
        <Skeleton className="mb-6 h-12 w-80" />

        <div className="space-y-6">
          {/* Car Summary Card Skeleton */}
          <div className="flex flex-col gap-4 rounded-xl border p-6 sm:flex-row sm:items-center">
            <Skeleton className="h-32 w-full rounded-lg sm:w-48" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          </div>

          {/* Form Fields Skeletons */}
          <div className="space-y-4 rounded-xl border p-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
