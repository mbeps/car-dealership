/**
 * Appends a cache-busting version query parameter to an asset URL.
 *
 * Branding assets use a version value when Supabase storage content changes. The function keeps URLs unchanged when no version is provided, so static assets and missing metadata do not need separate handling.
 *
 * @param url - Asset URL to update.
 * @param version - Asset version used as the query value.
 * @returns URL with `v` query parameter when a version exists.
 */
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
