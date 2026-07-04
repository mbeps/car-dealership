"use client";

import { getStorageUsage } from "@/actions/storage";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress";
import { env } from "@/lib/env";
import { useEffect, useMemo, useState } from "react";

/**
 * Formats bytes into a human-readable storage unit string (GB/MB).
 *
 * @param bytes - The number of bytes to format
 * @returns Formatted string with units
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${mb.toFixed(0)} MB`;
}

/**
 * StorageMeter Component
 *
 * Displays a global storage usage meter for administrators.
 * Fetches current usage from the server logic and calculates percentage against global limit.
 * Uses color variants (Primary/Amber/Destructive) based on the usage severity.
 */
export function StorageMeter() {
  const [usageBytes, setUsageBytes] = useState<number | null>(null);
  const limitGB = env.NEXT_PUBLIC_TOTAL_STORAGE_LIMIT_GB;
  const limitBytes = limitGB * 1024 * 1024 * 1024;

  useEffect(() => {
    async function fetchUsage() {
      const usage = await getStorageUsage();
      setUsageBytes(usage);
    }
    fetchUsage();
  }, []);

  const percentage = useMemo(() => {
    if (usageBytes === null || limitBytes === 0) return 0;
    return Math.min(100, (usageBytes / limitBytes) * 100);
  }, [usageBytes, limitBytes]);

  const displayPercentage = useMemo(() => {
    if (percentage >= 1) return `${percentage.toFixed(1)}%`;
    if (percentage >= 0.001) return `${percentage.toFixed(3)}%`;
    return "< 0.001%";
  }, [percentage]);

  const status = useMemo(() => {
    if (percentage >= 90)
      return { color: "bg-destructive", variant: "destructive" as const };
    if (percentage >= 70)
      return { color: "bg-amber-500", variant: "secondary" as const };
    return { color: "bg-primary", variant: "default" as const };
  }, [percentage]);

  if (usageBytes === null) {
    return (
      <Card size="sm" className="animate-pulse">
        <CardHeader>
          <div className="h-4 w-24 rounded bg-muted"></div>
          <div className="h-3 w-40 rounded bg-muted"></div>
        </CardHeader>
        <CardContent>
          <div className="h-3 w-full rounded bg-muted"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm" className="cursor-help transition-colors hover:bg-muted/5">
      <CardHeader className="flex-row items-center justify-between space-y-0 text-left">
        <div className="grid gap-1">
          <CardTitle className="text-sm font-semibold leading-none">
            Storage Usage
          </CardTitle>
          <CardDescription className="text-xs">
            {formatBytes(usageBytes)} / {formatBytes(limitBytes)}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={percentage}>
          <ProgressTrack className="h-3">
            <ProgressIndicator className={status.color} />
          </ProgressTrack>
        </Progress>
        <Badge variant={status.variant} className="font-bold">
          {displayPercentage}
        </Badge>
      </CardContent>
    </Card>
  );
}
