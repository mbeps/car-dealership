import { notFound } from "next/navigation";
import { getAdmin } from "@/actions/admin/get-admin";
import Header from "@/components/header";

/**
 * Wraps admin-only routes after verifying the current user is an authorized admin.
 * Prevents normal users and unauthenticated visitors from loading the admin area.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdmin();

  // If user not found in our db or not an admin, redirect to 404
  if (!admin.authorized) {
    return notFound();
  }

  return (
    <div className="h-full">
      <Header isAdminPage={true} />
      <main className="h-full pt-[80px] pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
