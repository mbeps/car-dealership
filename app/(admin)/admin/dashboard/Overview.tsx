"use client";

import { Calendar, Car, PoundSterling, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/types/common/dashboard-data";

/**
 * Props for the dashboard overview card grid.
 * Supplies normalized inventory and test drive metrics from the admin dashboard.
 */
interface OverviewProps {
  /** Dashboard metrics returned by the admin dashboard server action. */
  data: DashboardData;
}

/**
 * Renders high-level dealership performance metrics.
 * Summarizes inventory, sales, conversion, and test drive success for admin reporting.
 *
 * @param data - Dashboard metrics loaded from the admin dashboard
 * @returns Inventory and test drive KPI cards
 * @see DashboardData for the metrics shape
 */
export function Overview({ data }: OverviewProps) {
  const { cars, testDrives } = data;

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Cars</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{cars.total}</div>
            <p className="text-muted-foreground text-xs">
              {cars.available} available, {cars.sold} sold
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Test Drives</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{testDrives.total}</div>
            <p className="text-muted-foreground text-xs">
              {testDrives.pending} pending, {testDrives.confirmed} confirmed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {testDrives.conversionRate}%
            </div>
            <p className="text-muted-foreground text-xs">
              From test drives to sales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Cars Sold</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{cars.sold}</div>
            <p className="text-muted-foreground text-xs">
              {((cars.sold / cars.total) * 100).toFixed(1)}% of inventory
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Overview Content */}
      <Card>
        <CardHeader>
          <CardTitle>Dealership Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-medium text-sm">Car Inventory</h3>
                <div className="flex items-center">
                  <div className="h-2.5 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2.5 rounded-full bg-green-600"
                      style={{
                        width: `${(cars.available / cars.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm">
                    {((cars.available / cars.total) * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="mt-2 text-gray-500 text-xs">
                  Available inventory capacity
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-medium text-sm">Test Drive Success</h3>
                <div className="flex items-center">
                  <div className="h-2.5 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2.5 rounded-full bg-blue-600"
                      style={{
                        width: `${
                          (testDrives.completed / (testDrives.total || 1)) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm">
                    {(
                      (testDrives.completed / (testDrives.total || 1)) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
                <p className="mt-2 text-gray-500 text-xs">
                  Completed test drives
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center">
                <span className="font-bold text-3xl text-blue-600">
                  {cars.sold}
                </span>
                <p className="mt-1 text-gray-600 text-sm">Cars Sold</p>
              </div>
              <div className="text-center">
                <span className="font-bold text-3xl text-amber-600">
                  {testDrives.pending + testDrives.confirmed}
                </span>
                <p className="mt-1 text-gray-600 text-sm">
                  Upcoming Test Drives
                </p>
              </div>
              <div className="text-center">
                <span className="font-bold text-3xl text-green-600">
                  {((cars.available / (cars.total || 1)) * 100).toFixed(0)}%
                </span>
                <p className="mt-1 text-gray-600 text-sm">
                  Inventory Utilization
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
