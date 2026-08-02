import { ROUTES } from "@/constants/routes";
import { revalidatePath, revalidateTag } from "next/cache";

export const BRANDING_CACHE_TAG = "public-branding";

export function revalidateBrandingPages(): void {
  revalidateTag(BRANDING_CACHE_TAG, "max");
  revalidatePath(ROUTES.ADMIN.ADMIN_SETTINGS);
  revalidatePath(ROUTES.HOME.HOME);
  revalidatePath(ROUTES.HOME.CARS);
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}
