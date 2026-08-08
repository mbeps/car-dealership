import type { DealershipInfo } from "./dealership-info";

/**
 * Public dealership branding data.
 * Represents the subset of dealership details exposed to public layouts and car pages.
 *
 * @see DealershipInfo - Full dealership profile
 * @see getPublicBranding - Server action that returns this shape
 */
export type PublicBranding = Pick<
  DealershipInfo,
  "logoUrl" | "logoVersion" | "name"
>;
