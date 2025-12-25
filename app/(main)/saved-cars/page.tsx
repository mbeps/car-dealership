import { getSavedCars } from "@/actions/car-listing";
import { SavedCarsList } from "./_components/saved-cars-list";
import { ensureProfile } from "@/actions/auth";
import { redirect } from "next/navigation";
import { createSignInRedirect, ROUTES } from "@/constants/routes";
import { DEALERSHIP_NAME } from "@/constants/dealership-name";

export const metadata = {
  title: `Saved Cars | ${DEALERSHIP_NAME}`,
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
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-6xl mb-6 gradient-title">Your Saved Cars</h1>
      <SavedCarsList initialData={savedCarsResult} />
    </div>
  );
}
