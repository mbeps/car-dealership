"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Car, Calendar, Cog, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { signOut } from "@/actions/auth";

// Navigation items
const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: ROUTES.ADMIN,
  },
  {
    label: "Cars",
    icon: Car,
    href: ROUTES.ADMIN_CARS,
  },
  {
    label: "Test Drives",
    icon: Calendar,
    href: ROUTES.ADMIN_TEST_DRIVES,
  },
  {
    label: "Settings",
    icon: Cog,
    href: ROUTES.ADMIN_SETTINGS,
  },
];

/**
 * Admin navigation sidebar.
 * Desktop: Fixed left sidebar.
 * Mobile: Bottom tab bar.
 * Highlights active route and provides sign-out button.
 *
 * @see ROUTES - Route constants for navigation
 * @see signOut - Server action for logout
 */
export const Sidebar = () => {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full flex-col overflow-y-auto bg-white shadow-sm border-r">
        <div className="p-6">
          <Link href={ROUTES.ADMIN}>
            <h1 className="text-2xl font-bold">Admin</h1>
          </Link>
        </div>
        <div className="flex flex-col w-full">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-x-2 text-slate-500 text-sm font-medium pl-6 transition-all hover:text-slate-600 hover:bg-slate-100/50",
                pathname === route.href
                  ? "text-blue-700 bg-blue-100/50 hover:bg-blue-100 hover:text-blue-700"
                  : "",
                "h-12"
              )}
            >
              <route.icon className="h-5 w-5" />
              {route.label}
            </Link>
          ))}
        </div>
        <div className="mt-auto p-6">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-x-2 text-slate-500 text-sm font-medium transition-all hover:text-slate-600"
          >
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </div>

      {/* Mobile Bottom Tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex justify-around items-center h-16">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex flex-col items-center justify-center text-slate-500 text-xs font-medium transition-all",
              pathname === route.href ? "text-blue-700" : "",
              "py-1 flex-1"
            )}
          >
            <route.icon
              className={cn(
                "h-6 w-6 mb-1",
                pathname === route.href ? "text-blue-700" : "text-slate-500"
              )}
            />
            {route.label}
          </Link>
        ))}
      </div>
    </>
  );
};
