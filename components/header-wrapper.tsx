import { ensureProfile } from "@/actions/auth";
import HeaderClient from "./header-client";

interface HeaderWrapperProps {
  isAdminPage?: boolean;
}

const Header = async ({ isAdminPage = false }: HeaderWrapperProps) => {
  const user = await ensureProfile();
  const userRole = user?.role || null;

  return <HeaderClient isAdminPage={isAdminPage} userRole={userRole} />;
};

export default Header;
