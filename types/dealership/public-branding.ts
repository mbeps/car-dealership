import type { DealershipInfo } from "./dealership-info";

export type PublicBranding = Pick<
  DealershipInfo,
  "logoUrl" | "logoVersion" | "name"
>;
