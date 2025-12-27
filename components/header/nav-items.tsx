import {
  Home,
  CarFront,
  Heart,
  Calendar,
  LayoutDashboard,
  Car,
  Cog,
  Layout,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  showInMobile?: boolean;
  requiresAuth?: boolean;
  hideForAdmin?: boolean;
}

/*
 * Navigation configuration file containing all navigation items for the application.
 * Centralizes navigation data to ensure consistency across desktop and mobile navigation.
 * Defines main site navigation, admin portal navigation, and special admin portal button.
 *
 * @interface NavItem - Structure for navigation items with optional auth and role constraints
 * @property label - Display text for the navigation item
 * @property icon - Lucide icon component for visual representation
 * @property href - Route path for navigation
 * @property showInMobile - Whether to show this item in mobile bottom navigation
 * @property requiresAuth - Whether this item requires user authentication
 * @property hideForAdmin - Whether to hide this item for admin users
 * @see ROUTES - Centralized route constants
 * @author Maruf Bepary
 */

// Main site navigation
export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    icon: Home,
    href: ROUTES.HOME,
    showInMobile: true,
  },
  {
    label: "All Cars",
    icon: CarFront,
    href: ROUTES.CARS,
    showInMobile: true,
  },
  {
    label: "Saved",
    icon: Heart,
    href: ROUTES.SAVED_CARS,
    showInMobile: true,
    requiresAuth: true,
  },
  {
    label: "Reservations",
    icon: Calendar,
    href: ROUTES.RESERVATIONS,
    showInMobile: true,
    requiresAuth: true,
    hideForAdmin: true,
  },
];

// Admin portal navigation
export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: ROUTES.ADMIN,
    showInMobile: true,
  },
  {
    label: "Cars",
    icon: Car,
    href: ROUTES.ADMIN_CARS,
    showInMobile: true,
  },
  {
    label: "Test Drives",
    icon: Calendar,
    href: ROUTES.ADMIN_TEST_DRIVES,
    showInMobile: true,
  },
  {
    label: "Settings",
    icon: Cog,
    href: ROUTES.ADMIN_SETTINGS,
    showInMobile: true,
  },
];

// Admin portal button for main site
export const ADMIN_PORTAL_ITEM: NavItem = {
  label: "Admin Portal",
  icon: Layout,
  href: ROUTES.ADMIN,
  requiresAuth: true,
};
