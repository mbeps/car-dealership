import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

/**
 * Admin route 404 page for any missing car record under `/admin/cars/[id]`.
 *
 * @returns The admin car not found page UI.
 */
export default function AdminCarNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="mb-2 font-bold text-3xl">Car Not Found</h1>
      <p className="mb-8 max-w-md text-muted-foreground text-sm">
        The car you are trying to view or manage could not be found in the
        marketplace inventory.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href={ROUTES.ADMIN.ADMIN_CARS} className={buttonVariants()}>
          Back to Cars Inventory
        </Link>
        <Link
          href={ROUTES.ADMIN.ADMIN}
          className={buttonVariants({ variant: "outline" })}
        >
          Admin Dashboard
        </Link>
      </div>
    </div>
  );
}
