import { HEADER_LOGO_FALLBACK_SRC } from "./branding-constants";
import { appendVersionToAssetUrl } from "./append-version-to-asset-url";
import type { BrandingLogoSource } from "@/types/branding";

export function resolveHeaderLogoSrc(
  branding: BrandingLogoSource | null | undefined,
): string {
  if (!branding?.logoUrl) {
    return HEADER_LOGO_FALLBACK_SRC;
  }

  return appendVersionToAssetUrl(branding.logoUrl, branding.logoVersion);
}
