import { ROUTES } from "@/constants/routes";
import { revalidatePath, revalidateTag } from "next/cache";

export const BRANDING_CACHE_TAG = "public-branding";

export function revalidateBrandingPages(): void {
  revalidateTag(BRANDING_CACHE_TAG, "max");
  revalidatePath(ROUTES.ADMIN_SETTINGS);
  revalidatePath(ROUTES.HOME);
  revalidatePath(ROUTES.CARS);
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}
