import { notFound } from "next/navigation";
import { getAdmin } from "@/actions/admin";
import Header from "@/components/header";

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
      <main className="pt-[80px] h-full pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
