import {
  ICON_FALLBACK_SRC,
  ICON_SECONDARY_FALLBACK_SRC,
} from "./branding-constants";
import { appendVersionToAssetUrl } from "./append-version-to-asset-url";
import type { BrandingLogoSource } from "@/types/branding";

export function resolveIconHrefs(
  branding: BrandingLogoSource | null | undefined,
): string[] {
  const resolved: string[] = [];

  if (branding?.logoUrl) {
    resolved.push(
      appendVersionToAssetUrl(branding.logoUrl, branding.logoVersion),
    );
  }

  resolved.push(ICON_FALLBACK_SRC, ICON_SECONDARY_FALLBACK_SRC);

  return Array.from(new Set(resolved));
}
