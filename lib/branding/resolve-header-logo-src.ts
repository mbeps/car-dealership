import { brandingConstants } from "@/constants/branding";
import type { BrandingLogoSource } from "@/types/branding";
import { appendVersionToAssetUrl } from "./append-version-to-asset-url";

/**
 * Resolves the header logo image source from branding metadata.
 *
 * Returns the persisted logo URL with its version query parameter, or the configured fallback logo when no branding logo is available.
 *
 * @param branding - Branding metadata containing the header logo URL and version.
 * @returns Public URL for the header logo.
 */
export function resolveHeaderLogoSrc(
  branding: BrandingLogoSource | null | undefined,
): string {
  if (!branding?.logoUrl) {
    return brandingConstants.HEADER_LOGO_FALLBACK_SRC;
  }

  return appendVersionToAssetUrl(branding.logoUrl, branding.logoVersion);
}
