"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { getLogger } from "@/lib/logger";

const logger = getLogger(["app", "test-drive", "id", "error"]);

/**
 * Route-level error boundary for the test drive booking dynamic route.
 *
 * Logs test-drive form preparation errors and provides recovery actions.
 *
 * @param props - Error boundary props with caught error and reset function.
 * @returns The test-drive error fallback UI.
 */
export default function TestDriveError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Error loading test drive booking form: {error}", {
      error: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="mb-2 font-bold text-3xl">Unable to Load Booking</h1>
      <p className="mb-6 max-w-md text-muted-foreground text-sm">
        We encountered an error while setting up your test drive booking. Please
        try again.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button onClick={reset}>Try Again</Button>
        <Link
          href={ROUTES.HOME.CARS}
          className={buttonVariants({ variant: "outline" })}
        >
          Browse Available Cars
        </Link>
      </div>
    </div>
  );
}
