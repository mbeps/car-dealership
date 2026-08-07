import { getDashboardData } from "@/actions/admin/get-dashboard-data";
import { Dashboard } from "./dashboard/Dashboard";

export const dynamic = "force-dynamic";

/**
 * Admin dashboard page metadata.
 * Describes the dashboard entry page for marketplace administrators.
 */
export const metadata = {
  title: "Dashboard",
  description: "Admin dashboard for car marketplace",
};

/**
 * Admin dashboard entry page for car marketplace operations.
 * Fetches current marketplace data and renders the admin dashboard shell.
 *
 * @returns Dashboard view with preloaded admin data
 * @see getDashboardData for the server action that supplies dashboard metrics
 */
export default async function AdminDashboardPage() {
  // Fetch dashboard data
  const dashboardData = await getDashboardData();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <Dashboard initialData={dashboardData} />
    </div>
  );
}
