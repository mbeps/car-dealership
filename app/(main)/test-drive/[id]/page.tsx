import { getCarById } from "@/actions/cars/get-car-by-id";
import { notFound, redirect } from "next/navigation";
import { TestDriveForm } from "./_components/test-drive-form";
import { isCurrentUserAdmin } from "@/actions/auth/is-current-user-admin";
import { ROUTES } from "@/constants/routes";

/**
 * Defines SEO metadata for the test-drive booking page.
 *
 * @see TestDrivePage - Server page that validates access and renders the booking form.
 */
export async function generateMetadata() {
  return {
    title: "Book Test Drive",
    description: "Schedule a test drive in few seconds",
  };
}

/**
 * Server page for booking a test drive.
 * Redirects admins to the admin test-drive panel, fetches the car, and renders the booking form for customers.
 *
 * @param params - Route params containing the car id.
 */
export default async function TestDrivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Check if user is admin and redirect to admin panel
  const isAdmin = await isCurrentUserAdmin();
  if (isAdmin) {
    redirect(ROUTES.ADMIN.ADMIN_TEST_DRIVES);
  }

  // Fetch car details
  const { id } = await params;
  const result = await getCarById(id);

  // If car not found, show 404
  if (!result.success) {
    notFound();
  }

  return (
    <div className="py-12">
      <h1 className="text-6xl mb-6 gradient-title">Book a Test Drive</h1>
      <TestDriveForm
        car={result.data}
        testDriveInfo={result.data.testDriveInfo}
      />
    </div>
  );
}
