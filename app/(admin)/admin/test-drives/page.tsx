import { TestDrivesList } from "./_components/test-drive-list";
import { DEALERSHIP_NAME } from "@/constants/dealership-name";

export const metadata = {
  title: `Test Drives | ${DEALERSHIP_NAME} Admin`,
  description: "Manage test drive bookings",
};

export default function TestDrivesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Test Drive Management</h1>
      <TestDrivesList />
    </div>
  );
}
