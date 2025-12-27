"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ROUTES } from "@/constants/routes";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import {
  MAIN_NAV_ITEMS,
  ADMIN_NAV_ITEMS,
  ADMIN_PORTAL_ITEM,
} from "./nav-items";

interface HeaderClientProps {
  isAdminPage?: boolean;
  userRole?: UserRole | null;
}

/*
 * Main client header component that orchestrates the entire navigation system.
 * Renders logo, navigation links, and user menu based on authentication state and page context.
 * Handles both main site and admin portal layouts with appropriate navigation items.
 *
 * @param isAdminPage - Whether this is an admin page (shows admin navigation vs main site)
 * @param userRole - Current user's role for role-based navigation filtering
 * @returns Complete header with desktop nav, mobile nav, and user menu
 * @see DesktopNav - Desktop navigation links component
 * @see MobileNav - Mobile bottom navigation component
 * @see UserMenu - Authentication and user dropdown component
 * @author Maruf Bepary
 */
const HeaderClient = ({
  isAdminPage = false,
  userRole = null,
}: HeaderClientProps) => {
  const { user, signOut, openSignInModal } = useAuth();
  const isAuthenticated = !!user;
  const isAdmin = userRole === UserRole.ADMIN;

  // Determine which navigation items to show
  const desktopNavItems = isAdminPage ? ADMIN_NAV_ITEMS : MAIN_NAV_ITEMS;
  const mobileNavItems = isAdminPage ? ADMIN_NAV_ITEMS : MAIN_NAV_ITEMS;

  return (
    <>
      <header className="fixed top-0 w-full bg-white z-50 border-b">
        <nav className="mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link
              href={isAdminPage ? ROUTES.ADMIN : ROUTES.HOME}
              className="flex items-center gap-2"
            >
              <Image
                src="/logo.png"
                alt="Site Logo"
                width={200}
                height={60}
                className="h-12 w-auto object-contain"
              />
              {isAdminPage && (
                <span className="text-lg font-bold hidden md:inline">
                  Admin
                </span>
              )}
            </Link>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-4">
            {/* Desktop Navigation Links */}
            {isAdminPage ? (
              <>
                <DesktopNav
                  items={desktopNavItems}
                  isAuthenticated={isAuthenticated}
                  userRole={userRole}
                />
                <Link href={ROUTES.HOME}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <ArrowLeft size={18} />
                    <span>Back to App</span>
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <DesktopNav
                  items={desktopNavItems}
                  isAuthenticated={isAuthenticated}
                  userRole={userRole}
                />
                {/* Admin Portal Button - only show for authenticated admins */}
                {isAuthenticated && isAdmin && (
                  <Link href={ADMIN_PORTAL_ITEM.href}>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ADMIN_PORTAL_ITEM.icon size={18} />
                      <span>{ADMIN_PORTAL_ITEM.label}</span>
                    </Button>
                  </Link>
                )}
              </>
            )}

            {/* User Menu / Auth Buttons */}
            <UserMenu
              user={user}
              isAuthenticated={isAuthenticated}
              onSignOut={signOut}
              onOpenSignIn={openSignInModal}
              showSignInButton={!isAdminPage}
            />
          </div>
        </nav>
      </header>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        items={mobileNavItems}
        isAuthenticated={isAuthenticated}
        userRole={userRole}
      />
    </>
  );
};

export default HeaderClient;
