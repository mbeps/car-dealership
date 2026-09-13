import { CalendarX2 } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

/**
 * Route-level 404 page for missing test-drive booking targets.
 *
 * Rendered when the vehicle requested for a test drive cannot be found.
 *
 * @returns The test drive not found page UI.
 */
export default function TestDriveNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <CalendarX2 className="h-8 w-8" />
      </div>
      <h1 className="gradient-title mb-2 font-bold text-4xl">
        Test Drive Unavailable
      </h1>
      <p className="mb-8 max-w-md text-gray-600">
        The vehicle you are scheduling a test drive for does not exist or is no
        longer eligible for test drives.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href={ROUTES.HOME.CARS} className={buttonVariants()}>
          Browse Available Cars
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
