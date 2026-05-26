export const HEADER_LOGO_FALLBACK_SRC = "/logo.png";
export const ICON_FALLBACK_SRC = "/favicon.ico";
export const ICON_SECONDARY_FALLBACK_SRC = "/logo-white.png";

export interface BrandingLogoSource {
  logoUrl?: string | null;
  logoVersion?: string | null;
}

export function appendVersionToAssetUrl(
  url: string,
  version: string | null | undefined,
): string {
  if (!version) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

export function resolveHeaderLogoSrc(
  branding: BrandingLogoSource | null | undefined,
): string {
  if (!branding?.logoUrl) {
    return HEADER_LOGO_FALLBACK_SRC;
  }

  return appendVersionToAssetUrl(branding.logoUrl, branding.logoVersion);
}

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
