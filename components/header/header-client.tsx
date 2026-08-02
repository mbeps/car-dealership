"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import useAuthModal from "@/hooks/useAuthModal";
import { useSupabaseClient } from "@/providers/SupabaseProvider";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { DEALERSHIP_NAME } from "@/constants/dealership-name";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { resolveHeaderLogoSrc } from "@/lib/branding/resolve-header-logo-src";
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
  logoUrl?: string | null;
  logoVersion?: string | null;
  dealershipName?: string | null;
}

/*
 * Main client header component that orchestrates the entire navigation system.
 * Renders logo, navigation links, and user menu based on authentication state and page context.
 * Handles both main site and admin portal layouts with appropriate navigation items.
 *
 * @param isAdminPage - Whether this is an admin page (shows admin navigation vs main site)
 * @param userRole - Current user's role for role-based navigation filtering
 * @param logoUrl - Custom logo URL from branding settings
 * @param logoVersion - Logo version for cache busting
 * @param dealershipName - Dynamic dealership name for SEO and alt tags
 * @returns Complete header with desktop nav, mobile nav, and user menu
 * @see DesktopNav - Desktop navigation links component
 * @see MobileNav - Mobile bottom navigation component
 * @see UserMenu - Authentication and user dropdown component
 * @author Maruf Bepary
 */
const HeaderClient = ({
  isAdminPage = false,
  userRole = null,
  logoUrl = null,
  logoVersion = null,
  dealershipName = null,
}: HeaderClientProps) => {
  const { user } = useUser();
  const { onOpen: openSignInModal } = useAuthModal();
  const supabaseClient = useSupabaseClient();
  const router = useRouter();

  const signOut = async () => {
    await supabaseClient.auth.signOut();
    router.push(ROUTES.HOME.HOME);
  };

  const isAuthenticated = !!user;
  const isAdmin = userRole === UserRole.ADMIN;
  const logoSrc = resolveHeaderLogoSrc({ logoUrl, logoVersion });
  const isSvgLogo = /\.svg($|\?)/i.test(logoSrc);

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
              href={isAdminPage ? ROUTES.ADMIN.ADMIN : ROUTES.HOME.HOME}
              className="flex items-center gap-2"
            >
              <Image
                src={logoSrc}
                alt={dealershipName || DEALERSHIP_NAME}
                width={200}
                height={60}
                unoptimized={isSvgLogo}
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
                <Link href={ROUTES.HOME.HOME}>
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
