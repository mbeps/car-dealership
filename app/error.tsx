"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { getLogger } from "@/lib/logger";

const logger = getLogger(["app", "error"]);

/**
 * Root error boundary for handling unexpected runtime errors across the application.
 *
 * Logs the trapped error and gives users the choice to retry or navigate back to safety.
 *
 * @param props - Error boundary props containing the error object and reset callback.
 * @returns The root error fallback UI.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Unhandled runtime error in application root: {error}", {
      error: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="mb-2 font-bold text-3xl">Something went wrong</h1>
      <p className="mb-6 max-w-md text-muted-foreground text-sm">
        An unexpected error occurred while processing your request. Please try
        again or return to the home page.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button onClick={reset}>Try Again</Button>
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
