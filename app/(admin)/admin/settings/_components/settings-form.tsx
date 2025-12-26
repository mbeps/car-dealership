"use client";

import { Clock, Shield, Building2, Home } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealershipInfoForm } from "./dealership-info-form";
import { WorkingHoursForm } from "./working-hours-form";
import { AdminUsersList } from "./admin-users-list";

/**
 * Admin settings page with tabs.
 * Dealership Info: Contact details form.
 * Working Hours: Weekly schedule editor.
 * User Management: Admin role assignment table.
 * Prevents admins from changing own role.
 */
export const SettingsForm = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="info">
        <TabsList className="h-auto w-full md:w-auto md:h-9">
          <TabsTrigger
            value="info"
            className="h-auto flex-1 py-2 md:flex-none md:py-1"
          >
            <div className="flex flex-col items-center gap-1 md:flex-row md:gap-2">
              <Building2 className="h-5 w-5 md:h-4 md:w-4" />
              <span className="md:hidden text-xs">
                Dealership
                <br />
                Info
              </span>
              <span className="hidden md:inline">Dealership Info</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="hours"
            className="h-auto flex-1 py-2 md:flex-none md:py-1"
          >
            <div className="flex flex-col items-center gap-1 md:flex-row md:gap-2">
              <Clock className="h-5 w-5 md:h-4 md:w-4" />
              <span className="md:hidden text-xs">
                Working
                <br />
                Hours
              </span>
              <span className="hidden md:inline">Working Hours</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="admins"
            className="h-auto flex-1 py-2 md:flex-none md:py-1"
          >
            <div className="flex flex-col items-center gap-1 md:flex-row md:gap-2">
              <Shield className="h-5 w-5 md:h-4 md:w-4" />
              <span className="md:hidden text-xs">
                Admin
                <br />
                Users
              </span>
              <span className="hidden md:inline">Admin Users</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="home-data"
            className="h-auto flex-1 py-2 md:flex-none md:py-1"
          >
            <div className="flex flex-col items-center gap-1 md:flex-row md:gap-2">
              <Home className="h-5 w-5 md:h-4 md:w-4" />
              <span className="md:hidden text-xs">
                Home
                <br />
                Data
              </span>
              <span className="hidden md:inline">Home Data</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6 mt-6">
          <DealershipInfoForm />
        </TabsContent>

        <TabsContent value="hours" className="space-y-6 mt-6">
          <WorkingHoursForm />
        </TabsContent>

        <TabsContent value="admins" className="space-y-6 mt-6">
          <AdminUsersList />
        </TabsContent>

        <TabsContent value="home-data" className="space-y-6 mt-6">
          <div className="rounded-md border p-6">
            <h2 className="text-lg font-medium mb-2">
              Home Data (placeholder)
            </h2>
            <p className="text-sm text-muted-foreground">
              Placeholder content for Home Data settings. UI and controls will
              be implemented later.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
