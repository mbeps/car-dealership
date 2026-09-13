"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { getLogger } from "@/lib/logger";

const logger = getLogger(["app", "admin", "error"]);

/**
 * Route-level error boundary for the admin management portal.
 *
 * Catches runtime failures in administrative dashboards, forms, and settings.
 *
 * @param props - Error boundary props with caught error and retry trigger.
 * @returns The admin portal error fallback UI.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Unhandled error in admin portal: {error}", {
      error: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="mb-2 font-bold text-3xl">Admin Portal Error</h1>
      <p className="mb-6 max-w-md text-muted-foreground text-sm">
        An error occurred while loading administration resources. Please try
        reloading or return to the main dashboard.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button onClick={reset}>Try Again</Button>
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
