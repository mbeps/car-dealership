"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import { DashboardData } from "@/types/common/dashboard-data";

interface TestDrivesProps {
  data: DashboardData;
}

export function TestDrives({ data }: TestDrivesProps) {
  const { testDrives } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testDrives.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testDrives.pending}</div>
            <p className="text-xs text-muted-foreground">
              {((testDrives.pending / testDrives.total) * 100).toFixed(1)}% of
              bookings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testDrives.confirmed}</div>
            <p className="text-xs text-muted-foreground">
              {((testDrives.confirmed / testDrives.total) * 100).toFixed(1)}% of
              bookings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testDrives.completed}</div>
            <p className="text-xs text-muted-foreground">
              {((testDrives.completed / testDrives.total) * 100).toFixed(1)}% of
              bookings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testDrives.cancelled}</div>
            <p className="text-xs text-muted-foreground">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Conversion Rate Card */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Conversion Rate</h3>
                <div className="text-3xl font-bold text-blue-600">
                  {testDrives.conversionRate}%
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Test drives resulting in car purchases
                </p>
              </div>

              {/* Test Drive Success Rate */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Completion Rate</h3>
                <div className="text-3xl font-bold text-green-600">
                  {testDrives.total
                    ? ((testDrives.completed / testDrives.total) * 100).toFixed(
                        1
                      )
                    : 0}
                  %
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Test drives successfully completed
                </p>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-4 mt-4">
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
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full"
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
                      1
                    )}
                    %)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full"
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
                      1
                    )}
                    %)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
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
                      1
                    )}
                    %)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-red-500 h-2.5 rounded-full"
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
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gray-500 h-2.5 rounded-full"
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
