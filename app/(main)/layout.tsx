import type React from "react";

/**
 * Renders the main content wrapper for the authenticated route tree.
 * Keeps main page content centered with consistent responsive padding.
 *
 * @param children - Page content to render inside the container.
 */
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return <div className="container mx-auto my-20 px-4">{children}</div>;
};

export default MainLayout;
