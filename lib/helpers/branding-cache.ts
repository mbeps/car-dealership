import { revalidatePath, revalidateTag } from "next/cache";
import { ROUTES } from "@/constants/routes";

/**
 * Cache tag used for pages that render public branding data.
 */
export const BRANDING_CACHE_TAG = "public-branding";

/**
 * Revalidates Next.js cache entries that may display updated branding.
 *
 * Call after logo, favicon, or branding settings changes so header, icons, and home pages pick up new assets.
 *
 * @throws {Error} When cache revalidation fails unexpectedly.
 */
export function revalidateBrandingPages(): void {
  revalidateTag(BRANDING_CACHE_TAG, "max");
  revalidatePath(ROUTES.ADMIN.ADMIN_SETTINGS);
  revalidatePath(ROUTES.HOME.HOME);
  revalidatePath(ROUTES.HOME.CARS);
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}
