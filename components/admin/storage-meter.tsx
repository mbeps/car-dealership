"use client";

import { useEffect, useState, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { getStorageUsage } from "@/actions/storage";
import { env } from "@/lib/env";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
 * Uses color variants (Green/Yellow/Red) based on the usage severity.
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

  const statusColor = useMemo(() => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  }, [percentage]);

  if (usageBytes === null) {
    return (
      <div className="space-y-2 py-4">
        <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 py-4">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Global Storage Capacity</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div>
              <Progress value={percentage} className="h-2">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    statusColor,
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </Progress>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            <p className="text-xs">
              {formatBytes(usageBytes)} / {formatBytes(limitBytes)} ({limitGB}GB
              limit)
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <p className="text-[10px] text-muted-foreground italic">
        * Global limit enforced across all uploads.
      </p>
    </div>
  );
}
