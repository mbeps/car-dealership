"use client";

import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/types/common/dashboard-data";

/**
 * Props for the test drive dashboard breakdown.
 * Supplies normalized booking counts and conversion metrics.
 */
interface TestDrivesProps {
  /** Dashboard metrics returned by the admin dashboard server action. */
  data: DashboardData;
}

/**
 * Renders booking status counts and completion rates for test drives.
 * Helps admins track pending, confirmed, completed, cancelled, and no-show bookings.
 *
 * @param data - Dashboard metrics loaded from the admin dashboard
 * @returns Test drive status cards and percentage breakdowns
 * @see DashboardData for the metrics shape
 */
export function TestDrives({ data }: TestDrivesProps) {
  const { testDrives } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{testDrives.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{testDrives.pending}</div>
            <p className="text-muted-foreground text-xs">
              {((testDrives.pending / testDrives.total) * 100).toFixed(1)}% of
              bookings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{testDrives.confirmed}</div>
            <p className="text-muted-foreground text-xs">
              {((testDrives.confirmed / testDrives.total) * 100).toFixed(1)}% of
              bookings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{testDrives.completed}</div>
            <p className="text-muted-foreground text-xs">
              {((testDrives.completed / testDrives.total) * 100).toFixed(1)}% of
              bookings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{testDrives.cancelled}</div>
            <p className="text-muted-foreground text-xs">
              {((testDrives.cancelled / testDrives.total) * 100).toFixed(1)}% of
              bookings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Test Drive Status Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Test Drive Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Conversion Rate Card */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-medium text-lg">Conversion Rate</h3>
                <div className="font-bold text-3xl text-blue-600">
                  {testDrives.conversionRate}%
                </div>
                <p className="mt-1 text-gray-600 text-sm">
                  Test drives resulting in car purchases
                </p>
              </div>

              {/* Test Drive Success Rate */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-medium text-lg">Completion Rate</h3>
                <div className="font-bold text-3xl text-green-600">
                  {testDrives.total
                    ? ((testDrives.completed / testDrives.total) * 100).toFixed(
                        1,
                      )
                    : 0}
                  %
                </div>
                <p className="mt-1 text-gray-600 text-sm">
                  Test drives successfully completed
                </p>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="mt-4 space-y-4">
              <h3 className="font-medium">Booking Status Breakdown</h3>

              {/* Pending */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pending</span>
                  <span className="font-medium">
                    {testDrives.pending} (
                    {((testDrives.pending / testDrives.total) * 100).toFixed(1)}
                    %)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2.5 rounded-full bg-amber-500"
                    style={{
                      width: `${
                        (testDrives.pending / testDrives.total) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Confirmed */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Confirmed</span>
                  <span className="font-medium">
                    {testDrives.confirmed} (
                    {((testDrives.confirmed / testDrives.total) * 100).toFixed(
                      1,
                    )}
                    %)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2.5 rounded-full bg-green-500"
                    style={{
                      width: `${
                        (testDrives.confirmed / testDrives.total) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Completed */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completed</span>
                  <span className="font-medium">
                    {testDrives.completed} (
                    {((testDrives.completed / testDrives.total) * 100).toFixed(
                      1,
                    )}
                    %)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2.5 rounded-full bg-blue-600"
                    style={{
                      width: `${
                        (testDrives.completed / testDrives.total) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Cancelled */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cancelled</span>
                  <span className="font-medium">
                    {testDrives.cancelled} (
                    {((testDrives.cancelled / testDrives.total) * 100).toFixed(
                      1,
                    )}
                    %)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2.5 rounded-full bg-red-500"
                    style={{
                      width: `${
                        (testDrives.cancelled / testDrives.total) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* No Show */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>No Show</span>
                  <span className="font-medium">
                    {testDrives.noShow} (
                    {((testDrives.noShow / testDrives.total) * 100).toFixed(1)}
                    %)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2.5 rounded-full bg-gray-500"
                    style={{
                      width: `${(testDrives.noShow / testDrives.total) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
