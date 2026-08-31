import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

/**
 * Renders the custom 404 page.
 *
 * Gives visitors a clear error state and a direct link back to the home route.
 *
 * @returns The rendered not-found page.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="gradient-title mb-4 font-bold text-6xl">404</h1>
      <h2 className="mb-4 font-semibold text-2xl">Page Not Found</h2>
      <p className="mb-8 text-gray-600">
        Oops! The page you&apos;re looking for doesn&apos;t exist or has been
        moved.
      </p>
      <Link href={ROUTES.HOME.HOME}>
        <Button>Return Home</Button>
      </Link>
    </div>
  );
}
