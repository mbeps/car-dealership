import { brandingConstants } from "@/constants/branding";
import type { BrandingLogoSource } from "@/types/branding";
import { appendVersionToAssetUrl } from "./append-version-to-asset-url";

/**
 * Resolves favicon and secondary icon sources for the document head.
 *
 * Includes the branding logo as the primary icon when available, then always appends fallback icons so the site keeps usable icons before branding data loads.
 *
 * @param branding - Branding metadata containing the primary logo URL and version.
 * @returns Icon href list with branding icon first and fallback icons last.
 */
export function resolveIconHrefs(
  branding: BrandingLogoSource | null | undefined,
): string[] {
  const resolved: string[] = [];

  if (branding?.logoUrl) {
    resolved.push(
      appendVersionToAssetUrl(branding.logoUrl, branding.logoVersion),
    );
  }

  resolved.push(
    brandingConstants.ICON_FALLBACK_SRC,
    brandingConstants.ICON_SECONDARY_FALLBACK_SRC,
  );

  return Array.from(new Set(resolved));
}
