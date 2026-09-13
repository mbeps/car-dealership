"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { getLogger } from "@/lib/logger";

const logger = getLogger(["app", "cars", "id", "error"]);

/**
 * Route-level error boundary for the car details dynamic route.
 *
 * Logs car loading errors and allows retrying the query or navigating back to inventory.
 *
 * @param props - Error boundary props containing the caught error and reset function.
 * @returns The car details error fallback UI.
 */
export default function CarDetailsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Error loading car details: {error}", {
      error: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="mb-2 font-bold text-3xl">Failed to Load Car Details</h1>
      <p className="mb-6 max-w-md text-muted-foreground text-sm">
        We encountered a problem while retrieving the details for this vehicle.
        Please try again.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button onClick={reset}>Try Again</Button>
        <Link
          href={ROUTES.HOME.CARS}
          className={buttonVariants({ variant: "outline" })}
        >
          Browse All Cars
        </Link>
      </div>
    </div>
  );
}
