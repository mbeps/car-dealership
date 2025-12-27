"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NavItem } from "./nav-items";
import { UserRoleEnum as UserRole } from "@/enums/user-role";

interface DesktopNavProps {
  items: NavItem[];
  isAuthenticated: boolean;
  userRole?: UserRole | null;
}

/*
 * Desktop navigation component that renders horizontal navigation links.
 * Filters navigation items based on authentication state and user role.
 * Only renders on desktop screens (hidden on mobile via CSS).
 *
 * @param items - Array of navigation items to render
 * @param isAuthenticated - Whether the user is currently authenticated
 * @param userRole - Current user's role for role-based filtering
 * @returns Horizontal navigation bar with filtered links
 * @see NavItem - Navigation item structure with auth/role constraints
 * @author Maruf Bepary
 */
export const DesktopNav = ({
  items,
  isAuthenticated,
  userRole,
}: DesktopNavProps) => {
  const isAdmin = userRole === UserRole.ADMIN;

  return (
    <div className="hidden md:flex items-center gap-2">
      {items.map((item) => {
        // Check if item should be shown based on auth and role
        if (item.requiresAuth && !isAuthenticated) return null;
        if (item.hideForAdmin && isAdmin) return null;

        return (
          <Link key={item.href} href={item.href}>
            <Button variant="ghost" className="flex items-center gap-2">
              <item.icon size={18} />
              <span>{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );
};
