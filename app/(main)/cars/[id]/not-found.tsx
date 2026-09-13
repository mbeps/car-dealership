import { CarFront } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

/**
 * Route-level 404 page for missing car detail records.
 *
 * Rendered when a car identifier does not exist or has been removed from the catalog.
 *
 * @returns The car not found page UI.
 */
export default function CarNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <CarFront className="h-8 w-8" />
      </div>
      <h1 className="gradient-title mb-2 font-bold text-4xl">Car Not Found</h1>
      <p className="mb-8 max-w-md text-gray-600">
        The vehicle you are looking for does not exist, has been sold, or has
        been removed from our marketplace inventory.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href={ROUTES.HOME.CARS} className={buttonVariants()}>
          Browse All Cars
        </Link>
        <Link
          href={ROUTES.HOME.HOME}
          className={buttonVariants({ variant: "outline" })}
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
