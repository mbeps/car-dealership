import { getSavedCars } from "@/actions/cars/get-saved-cars";
import { SavedCarsList } from "./_components/saved-cars-list";
import { ensureProfile } from "@/actions/auth/ensure-profile";
import { redirect } from "next/navigation";
import { createSignInRedirect } from "@/lib/route/createSignInRedirect";
import { ROUTES } from "@/constants/routes";

/**
 * Defines SEO metadata for the saved cars page.
 *
 * @see SavedCarsPage - Server page that enforces profile access and renders saved cars.
 */
export const metadata = {
  title: "Saved Cars",
  description: "View your saved cars and favorites",
};

/**
 * Server page for viewing saved cars.
 * Ensures the current user has a profile, redirects unauthenticated users to sign in, then renders saved inventory.
 *
 * @see ensureProfile - Server action that enforces profile access.
 * @see SavedCarsList - Client component that renders saved car cards.
 */
export default async function SavedCarsPage() {
  // Check authentication on server
  const user = await ensureProfile();

  if (!user) {
    redirect(createSignInRedirect(ROUTES.SAVED_CARS));
  }

  // Fetch saved cars on the server
  const savedCarsResult = await getSavedCars();

  return (
    <div className="py-12">
      <h1 className="text-6xl mb-6 gradient-title">Your Saved Cars</h1>
      <SavedCarsList initialData={savedCarsResult} />
    </div>
  );
}
