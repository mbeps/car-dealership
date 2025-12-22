import { getUserTestDrives } from "@/actions/test-drive";
import { ensureProfile } from "@/actions/auth";
import { redirect } from "next/navigation";
import { ReservationsList } from "./_components/reservations-list";
import { createSignInRedirect, ROUTES } from "@/lib/routes";

export const metadata = {
  title: "My Reservations | MN LTD",
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
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-6xl mb-6 gradient-title">Your Reservations</h1>
      <ReservationsList initialData={reservationsResult} />
    </div>
  );
}
