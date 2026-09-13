import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

/**
 * Renders the global custom 404 page.
 *
 * Gives visitors a clear error state and direct links back to the home route or car inventory.
 *
 * @returns The rendered not-found page.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="gradient-title mb-4 font-bold text-6xl">404</h1>
      <h2 className="mb-4 font-semibold text-2xl">Page Not Found</h2>
      <p className="mb-8 max-w-md text-gray-600">
        Oops! The page you&apos;re looking for doesn&apos;t exist or has been
        moved.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href={ROUTES.HOME.HOME} className={buttonVariants()}>
          Return Home
        </Link>
        <Link
          href={ROUTES.HOME.CARS}
          className={buttonVariants({ variant: "outline" })}
        >
          Browse Cars
        </Link>
      </div>
    </div>
  );
}
