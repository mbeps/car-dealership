"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";
import { ActionResponse } from "@/types/common/action-response";
import { DashboardData } from "@/types/common/dashboard-data";
import { Overview } from "./Overview";
import { TestDrives } from "./TestDrives";

/**
 * Admin dashboard with KPI cards and charts.
 * Displays car inventory stats and test drive metrics.
 * Tabbed interface for overview and test drive breakdowns.
 *
 * @param initialData - Dashboard data from server
 * @see getDashboardData - Server action fetching metrics
 * @see DashboardData - Type for dashboard metrics
 */
export function Dashboard({
  initialData,
}: {
  initialData: ActionResponse<DashboardData>;
}) {
  const [activeTab, setActiveTab] = useState("overview");

  // Show error if data fetch failed
  if (!initialData || !initialData.success) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {initialData?.error || "Failed to load dashboard data"}
        </AlertDescription>
      </Alert>
    );
  }

  const { data } = initialData;

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="test-drives">Test Drives</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Overview data={data} />
        </TabsContent>

        <TabsContent value="test-drives" className="space-y-6">
          <TestDrives data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
