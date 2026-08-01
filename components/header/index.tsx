import { ensureProfile } from "@/actions/auth/ensure-profile";
import { getPublicBranding } from "@/actions/settings";
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
  const [user, branding] = await Promise.all([
    ensureProfile(),
    getPublicBranding(),
  ]);
  const userRole = user?.role || null;

  return (
    <HeaderClient
      isAdminPage={isAdminPage}
      userRole={userRole}
      logoUrl={branding.logoUrl}
      logoVersion={branding.logoVersion}
      dealershipName={branding.name}
    />
  );
};

export default Header;
