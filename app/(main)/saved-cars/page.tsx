import { getSavedCars } from "@/actions/cars/get-saved-cars";
import { SavedCarsList } from "./_components/saved-cars-list";
import { ensureProfile } from "@/actions/auth/ensure-profile";
import { redirect } from "next/navigation";
import { createSignInRedirect } from "@/lib/route/createSignInRedirect";
import { ROUTES } from "@/constants/routes";

export const metadata = {
  title: "Saved Cars",
  description: "View your saved cars and favorites",
};

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
