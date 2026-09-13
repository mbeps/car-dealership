import { Spinner } from "@/components/ui/spinner";

/**
 * Root loading state rendered during route transitions and root suspense boundaries.
 *
 * Displays a clean, centered loading spinner and descriptive status text.
 *
 * @returns The root loading spinner UI.
 */
export default function RootLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4">
      <Spinner className="size-8 text-primary" />
      <p className="font-medium text-muted-foreground text-sm">Loading...</p>
    </div>
  );
}
