"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavItem } from "./nav-items";
import { UserRoleEnum as UserRole } from "@/enums/user-role";

interface MobileNavProps {
  items: NavItem[];
  isAuthenticated: boolean;
  userRole?: UserRole | null;
}

/*
 * Mobile bottom navigation component that renders tab-based navigation.
 * Filters navigation items based on authentication state and user role.
 * Shows active state for current route and only renders on mobile screens.
 *
 * @param items - Array of navigation items to potentially render
 * @param isAuthenticated - Whether the user is currently authenticated
 * @param userRole - Current user's role for role-based filtering
 * @returns Fixed bottom navigation bar with filtered tabs
 * @see NavItem - Navigation item structure with mobile visibility constraints
 * @author Maruf Bepary
 */
export const MobileNav = ({
  items,
  isAuthenticated,
  userRole,
}: MobileNavProps) => {
  const pathname = usePathname();
  const isAdmin = userRole === UserRole.ADMIN;

  // Filter items based on auth and role
  const visibleItems = items.filter((item) => {
    if (!item.showInMobile) return false;
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.hideForAdmin && isAdmin) return false;
    return true;
  });

  if (visibleItems.length === 0) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex justify-around items-center h-16">
      {visibleItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center text-slate-500 text-xs font-medium transition-all",
              isActive ? "text-blue-700" : "",
              "py-1 flex-1"
            )}
          >
            <item.icon
              className={cn("h-5 w-5 mb-1", isActive ? "text-blue-700" : "")}
            />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
};
