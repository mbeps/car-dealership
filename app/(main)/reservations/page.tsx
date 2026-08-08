import { getUserTestDrives } from "@/actions/test-drive/get-user-test-drives";
import { ensureProfile } from "@/actions/auth/ensure-profile";
import { redirect } from "next/navigation";
import { ReservationsList } from "./_components/reservations-list";
import { createSignInRedirect } from "@/lib/route/createSignInRedirect";
import { ROUTES } from "@/constants/routes";

/**
 * Defines SEO metadata for the user reservations page.
 *
 * @see ReservationsPage - Server page that enforces profile access and renders reservations.
 */
export const metadata = {
  title: "My Reservations",
  description: "Manage your test drive reservations",
};

/**
 * Server page for user test-drive reservations.
 * Ensures the current user has a profile, redirects unauthenticated users to sign in, then renders their bookings.
 *
 * @see ensureProfile - Server action that enforces profile access.
 * @see ReservationsList - Client component that groups and renders bookings.
 */
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
