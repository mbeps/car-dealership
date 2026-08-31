import { TestDrivesList } from "./_components/test-drive-list";

/**
 * Test drive management page metadata.
 * Describes the admin route for managing test drive bookings.
 */
export const metadata = {
  title: "Test Drive Management",
  description: "Manage test drive bookings",
};

/**
 * Admin page for managing test drive bookings.
 * Delegates search, filtering, status updates, and cancellation to the list component.
 *
 * @returns Test drive management page with the admin booking list
 */
export default function TestDrivesPage() {
  return (
    <div>
      <h1 className="mb-6 font-bold text-2xl">Test Drive Management</h1>
      <TestDrivesList />
    </div>
  );
}
