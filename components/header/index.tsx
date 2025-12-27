import { ensureProfile } from "@/actions/auth";
import HeaderClient from "./header-client";

interface HeaderProps {
  isAdminPage?: boolean;
}

/*
 * Server component that fetches user profile and passes it to the client header.
 * Handles both main site and admin portal navigation by determining user role.
 * Acts as the entry point for the unified header system.
 *
 * @param isAdminPage - Whether this header is for admin pages (affects navigation items)
 * @returns HeaderClient component with user data
 * @see ensureProfile - Server action for fetching user profile
 * @see HeaderClient - Client component that renders the actual header
 * @author Maruf Bepary
 */
const Header = async ({ isAdminPage = false }: HeaderProps) => {
  const user = await ensureProfile();
  const userRole = user?.role || null;

  return <HeaderClient isAdminPage={isAdminPage} userRole={userRole} />;
};

export default Header;
