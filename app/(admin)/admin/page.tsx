import { getDashboardData } from "@/actions/admin/get-dashboard-data";
import { Dashboard } from "./dashboard/Dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard",
  description: "Admin dashboard for car marketplace",
};

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
