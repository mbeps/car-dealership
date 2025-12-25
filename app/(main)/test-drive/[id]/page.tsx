import { getCarById } from "@/actions/car-listing";
import { notFound, redirect } from "next/navigation";
import { TestDriveForm } from "./_components/test-drive-form";
import { isCurrentUserAdmin } from "@/actions/auth";
import { ROUTES } from "@/constants/routes";
import { DEALERSHIP_NAME } from "@/constants/dealership-name";

export async function generateMetadata() {
  return {
    title: `Book Test Drive | ${DEALERSHIP_NAME}`,
    description: `Schedule a test drive in few seconds`,
  };
}

export default async function TestDrivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Check if user is admin and redirect to admin panel
  const isAdmin = await isCurrentUserAdmin();
  if (isAdmin) {
    redirect(ROUTES.ADMIN_TEST_DRIVES);
  }

  // Fetch car details
  const { id } = await params;
  const result = await getCarById(id);

  // If car not found, show 404
  if (!result.success) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-6xl mb-6 gradient-title">Book a Test Drive</h1>
      <TestDriveForm
        car={result.data}
        testDriveInfo={result.data.testDriveInfo}
      />
    </div>
  );
}
