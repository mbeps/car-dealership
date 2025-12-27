import { getUserTestDrives } from "@/actions/test-drive";
import { ensureProfile } from "@/actions/auth";
import { redirect } from "next/navigation";
import { ReservationsList } from "./_components/reservations-list";
import { createSignInRedirect, ROUTES } from "@/constants/routes";
import { DEALERSHIP_NAME } from "@/constants/dealership-name";

export const metadata = {
  title: `My Reservations | ${DEALERSHIP_NAME}`,
  description: "Manage your test drive reservations",
};

export default async function ReservationsPage() {
  // Check authentication on server
  const user = await ensureProfile();

  if (!user) {
    redirect(createSignInRedirect(ROUTES.RESERVATIONS));
  }

  // Fetch reservations on the server
  const reservationsResult = await getUserTestDrives();

  return (
    <div className="py-12">
      <h1 className="text-6xl mb-6 gradient-title">Your Reservations</h1>
      <ReservationsList initialData={reservationsResult} />
    </div>
  );
}
