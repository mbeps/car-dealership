import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton UI for admin portal pages.
 *
 * Renders header and card skeletons for dashboard metrics, lists, or forms.
 *
 * @returns The admin section loading skeleton UI.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>

      {/* Content Skeleton */}
      <div className="rounded-xl border p-6">
        <Skeleton className="mb-4 h-6 w-36" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
